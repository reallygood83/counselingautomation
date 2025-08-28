import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/firebase'
import { doc, getDoc, collection, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore'

// 동적 API 라우트로 설정
export const dynamic = 'force-dynamic'

// 특정 설문의 응답을 자동으로 수집하고 분석하는 엔드포인트
export async function POST(
  request: NextRequest,
  { params }: { params: { surveyId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || !session.accessToken) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const { surveyId } = params
    console.log('설문 응답 자동 수집 시작:', { surveyId, userEmail: session.user.email })

    // 1. 설문 정보 조회
    const surveyRef = doc(db, 'surveys', surveyId)
    const surveyDoc = await getDoc(surveyRef)
    
    if (!surveyDoc.exists()) {
      return NextResponse.json(
        { error: '설문을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const surveyData = surveyDoc.data()
    const formId = surveyData.formId

    if (!formId) {
      return NextResponse.json(
        { error: '이 설문은 아직 Google Forms로 배포되지 않았습니다.' },
        { status: 400 }
      )
    }

    console.log('Forms 응답 수집 시작:', { formId })

    // 2. Google Forms 응답 수집
    const formsResponse = await fetch(`${request.nextUrl.origin}/api/forms/responses?formId=${formId}`, {
      headers: {
        'Cookie': request.headers.get('cookie') || ''
      }
    })

    if (!formsResponse.ok) {
      const errorData = await formsResponse.json().catch(() => ({}))
      throw new Error(errorData.error || 'Forms 응답 수집 실패')
    }

    const formsData = await formsResponse.json()
    const responses = formsData.responses || []
    const unmatchedResponses = formsData.unmatchedData || []

    console.log('Forms 응답 수집 완료:', {
      totalResponses: formsData.totalResponses,
      matchedResponses: responses.length,
      unmatchedResponses: unmatchedResponses.length
    })

    if (responses.length === 0) {
      return NextResponse.json({
        success: true,
        message: '수집할 응답이 없습니다.',
        stats: {
          totalResponses: formsData.totalResponses,
          matchedResponses: 0,
          unmatchedResponses: unmatchedResponses.length,
          savedResponses: 0,
          analyzedResponses: 0
        }
      })
    }

    // 3. Firebase에 응답 저장 (개선된 JSON 구조)
    console.log('Firebase에 응답 저장 시작')
    const savedResponses = []
    
    for (const response of responses) {
      try {
        // 학생 식별 정보와 응답 데이터 분리
        const { studentName, className, studentNumber, answers, ...otherData } = response
        
        // 응답 데이터를 JSON 형태로 구조화 (분석용)
        const responseData = {
          questions: Object.entries(answers || {}).map(([questionId, answerInfo], index) => ({
            questionIndex: index + 1,
            questionId,
            questionTitle: (answerInfo as any)?.questionTitle || `질문 ${index + 1}`,
            questionType: (answerInfo as any)?.questionType || 'text',
            answer: (answerInfo as any)?.answer || null,
            answerValue: (answerInfo as any)?.answer || null // 분석용 복사본
          })),
          metadata: {
            totalQuestions: Object.keys(answers || {}).length,
            completedQuestions: Object.values(answers || {}).filter(a => (a as any)?.answer).length,
            responseLanguage: 'ko',
            submissionMethod: 'google_forms'
          }
        }

        const responseDoc = {
          // 학생 식별 정보 (검색/필터용)
          studentInfo: {
            name: studentName,
            class: className,
            number: studentNumber
          },
          
          // 분석용 JSON 구조화된 응답 데이터
          responseData,
          
          // 원본 데이터 (호환성 유지)
          originalAnswers: answers,
          
          // 메타데이터
          surveyId,
          formId,
          responseId: otherData.responseId || null,
          submittedAt: otherData.submittedAt || null,
          teacherEmail: session.user.email,
          savedAt: serverTimestamp(),
          
          // 분석 상태
          processed: false,
          selScores: null, // SEL 분석 결과는 나중에 업데이트
          analysisStatus: 'pending',
          
          // 데이터 버전 (향후 호환성)
          dataVersion: '2.0',
          dataStructure: 'json_optimized'
        }

        const docRef = await addDoc(collection(db, 'surveyResponses'), responseDoc)
        savedResponses.push({
          id: docRef.id,
          responseId: response.responseId || otherData.responseId,
          studentName,
          responseData // 분석용 JSON 데이터 포함
        })

        console.log('응답 저장 완료:', { docId: docRef.id, studentName: response.studentName })
      } catch (saveError) {
        console.error('응답 저장 실패:', { 
          responseId: response.responseId, 
          error: saveError instanceof Error ? saveError.message : saveError 
        })
      }
    }

    // 4. SEL 점수 배치 분석 (API 한계 고려)
    console.log('SEL 점수 배치 분석 시작')
    const analyzedResponses = []
    const batchSize = 3 // API 한계를 고려한 배치 크기
    const batches = []
    
    // 응답을 배치로 나누기
    for (let i = 0; i < savedResponses.length; i += batchSize) {
      batches.push(savedResponses.slice(i, i + batchSize))
    }
    
    console.log(`총 ${savedResponses.length}개 응답을 ${batches.length}개 배치로 처리`)
    
    // 배치별 순차 처리
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex]
      console.log(`배치 ${batchIndex + 1}/${batches.length} 처리 중 (${batch.length}개 응답)`)
      
      try {
        // 배치 내의 응답들을 병렬 처리
        const batchPromises = batch.map(async (savedResponse) => {
          try {
            // 새로운 JSON 구조에서 데이터 추출
            const responseData = savedResponse.responseData
            if (!responseData || !responseData.questions) {
              console.warn('응답 데이터 구조가 올바르지 않습니다:', savedResponse.id)
              return null
            }

            // 개선된 SEL 점수 계산 (JSON 구조 사용)
            const selScores = await calculateSelScoresFromJson(responseData, surveyData.questions)
            
            // Firebase 업데이트
            const responseRef = doc(db, 'surveyResponses', savedResponse.id)
            await updateDoc(responseRef, {
              selScores,
              processed: true,
              analysisStatus: 'completed',
              analyzedAt: serverTimestamp(),
              batchInfo: {
                batchIndex: batchIndex + 1,
                totalBatches: batches.length,
                processedAt: new Date().toISOString()
              }
            })

            console.log(`SEL 분석 완료 [배치 ${batchIndex + 1}]:`, { 
              studentName: savedResponse.studentName, 
              selScores 
            })

            return {
              id: savedResponse.id,
              studentName: savedResponse.studentName,
              selScores
            }
          } catch (error) {
            console.error(`개별 분석 실패 [배치 ${batchIndex + 1}]:`, { 
              responseId: savedResponse.id,
              studentName: savedResponse.studentName,
              error: error instanceof Error ? error.message : error 
            })
            return null
          }
        })
        
        // 배치 내 모든 분석 완료 대기
        const batchResults = await Promise.all(batchPromises)
        const successfulResults = batchResults.filter(result => result !== null)
        analyzedResponses.push(...successfulResults)
        
        // API 한계 방지를 위한 배치 간 대기 (1초)
        if (batchIndex < batches.length - 1) {
          console.log('다음 배치 처리 전 1초 대기...')
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
      } catch (batchError) {
        console.error(`배치 ${batchIndex + 1} 처리 실패:`, batchError)
        // 배치 실패 시에도 다음 배치 계속 처리
      }
    }
    
    console.log(`전체 배치 분석 완료: ${analyzedResponses.length}/${savedResponses.length} 성공`)

    // 5. 설문 통계 업데이트
    await updateDoc(surveyRef, {
      responseCount: (surveyData.responseCount || 0) + savedResponses.length,
      lastResponseAt: serverTimestamp(),
      analysisStatus: analyzedResponses.length > 0 ? 'partial' : 'pending'
    })

    return NextResponse.json({
      success: true,
      message: `${savedResponses.length}개의 응답이 수집 및 분석되었습니다.`,
      stats: {
        totalResponses: formsData.totalResponses,
        matchedResponses: responses.length,
        unmatchedResponses: unmatchedResponses.length,
        savedResponses: savedResponses.length,
        analyzedResponses: analyzedResponses.length
      },
      responses: analyzedResponses,
      unmatchedData: unmatchedResponses
    })

  } catch (error) {
    console.error('응답 자동 수집 및 분석 오류:', error)
    
    const errorMessage = error instanceof Error ? error.message : '응답 수집 중 오류가 발생했습니다.'
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

// 개선된 SEL 점수 계산 함수 (JSON 구조용)
async function calculateSelScoresFromJson(responseData: any, surveyQuestions: any[]): Promise<Record<string, number>> {
  const selCategories: Record<string, number[]> = {
    selfAwareness: [],
    selfManagement: [],
    socialAwareness: [],
    relationship: [],
    decisionMaking: []
  }

  console.log('JSON 구조 기반 SEL 점수 계산 시작:', {
    questionsCount: responseData.questions?.length || 0,
    metadata: responseData.metadata
  })

  // JSON 구조에서 질문과 답변 처리
  if (responseData.questions && Array.isArray(responseData.questions)) {
    responseData.questions.forEach((questionData: any, index: number) => {
      try {
        // 설문 설정에서 해당 질문의 카테고리 찾기
        const category = surveyQuestions[index]?.category || 'selfAwareness'
        const answerValue = questionData.answerValue || questionData.answer
        
        if (answerValue) {
          const score = convertAnswerToScore(answerValue)
          
          if (selCategories[category as keyof typeof selCategories]) {
            selCategories[category as keyof typeof selCategories].push(score)
            console.log(`질문 ${index + 1}: ${category} → ${score}점`)
          }
        }
      } catch (error) {
        console.warn(`질문 ${index + 1} 처리 중 오류:`, error)
      }
    })
  }

  // 카테고리별 평균 점수 계산
  const selScores: Record<string, number> = {}
  Object.entries(selCategories).forEach(([category, scores]) => {
    if (scores.length > 0) {
      const average = scores.reduce((sum, score) => sum + score, 0) / scores.length
      selScores[category] = Math.round(average * 10) / 10 // 소수점 1자리
    } else {
      selScores[category] = 3.0 // 기본 점수
    }
  })

  console.log('SEL 점수 계산 완료:', selScores)
  return selScores
}

// 답변을 점수로 변환하는 공통 함수
function convertAnswerToScore(answerValue: any): number {
  if (typeof answerValue !== 'string') {
    return 3 // 기본 점수
  }
  
  const answer = answerValue.toLowerCase()
  
  // 5점 척도 매핑
  if (answer.includes('매우') || answer.includes('항상') || answer.includes('완전히')) {
    return 5
  } else if (answer.includes('자주') || answer.includes('잘') || answer.includes('대체로')) {
    return 4
  } else if (answer.includes('보통') || answer.includes('때때로') || answer.includes('가끔')) {
    return 3
  } else if (answer.includes('별로') || answer.includes('거의') || answer.includes('조금')) {
    return 2
  } else if (answer.includes('전혀') || answer.includes('없다') || answer.includes('안')) {
    return 1
  }
  
  // 숫자로 된 답변 처리
  const numMatch = answer.match(/(\d+)/)
  if (numMatch) {
    const num = parseInt(numMatch[1])
    return Math.min(Math.max(num, 1), 5) // 1-5 범위로 제한
  }
  
  return 3 // 기본 점수
}

// 기존 SEL 점수 계산 함수 (호환성 유지)
async function calculateSelScores(answers: Record<string, any>, questions: any[]): Promise<Record<string, number>> {
  const selCategories: Record<string, number[]> = {
    selfAwareness: [],
    selfManagement: [],
    socialAwareness: [],
    relationship: [],
    decisionMaking: []
  }

  // 질문별 카테고리 분류 및 점수 계산
  questions.forEach((question, index) => {
    const category = question.category || 'selfAwareness'
    const answerId = Object.keys(answers)[index]
    
    if (answerId && answers[answerId]) {
      const answerValue = answers[answerId].answer
      const score = convertAnswerToScore(answerValue)
      
      if (selCategories[category as keyof typeof selCategories]) {
        selCategories[category as keyof typeof selCategories].push(score)
      }
    }
  })

  // 카테고리별 평균 점수 계산
  const selScores: Record<string, number> = {}
  Object.entries(selCategories).forEach(([category, scores]) => {
    if (scores.length > 0) {
      const average = scores.reduce((sum, score) => sum + score, 0) / scores.length
      selScores[category] = Math.round(average * 10) / 10 // 소수점 1자리
    } else {
      selScores[category] = 3.0 // 기본 점수
    }
  })

  return selScores
}