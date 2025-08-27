import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/firebase'
import { doc, getDoc, collection, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore'

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

    // 3. Firebase에 응답 저장
    console.log('Firebase에 응답 저장 시작')
    const savedResponses = []
    
    for (const response of responses) {
      try {
        const responseDoc = {
          ...response,
          surveyId,
          formId,
          teacherEmail: session.user.email,
          savedAt: serverTimestamp(),
          processed: false,
          selScores: null, // SEL 분석 결과는 나중에 업데이트
          analysisStatus: 'pending'
        }

        const docRef = await addDoc(collection(db, 'surveyResponses'), responseDoc)
        savedResponses.push({
          id: docRef.id,
          responseId: response.responseId,
          studentName: response.studentName
        })

        console.log('응답 저장 완료:', { docId: docRef.id, studentName: response.studentName })
      } catch (saveError) {
        console.error('응답 저장 실패:', { 
          responseId: response.responseId, 
          error: saveError instanceof Error ? saveError.message : saveError 
        })
      }
    }

    // 4. SEL 점수 자동 분석 (간단한 버전)
    console.log('SEL 점수 자동 분석 시작')
    const analyzedResponses = []
    
    for (const savedResponse of savedResponses) {
      try {
        // 실제 응답 데이터 찾기
        const originalResponse = responses.find((r: any) => r.responseId === savedResponse.responseId)
        if (!originalResponse) continue

        // 간단한 SEL 점수 계산 (실제로는 더 복잡한 로직이 필요)
        const selScores = await calculateSelScores(originalResponse.answers, surveyData.questions)
        
        // Firebase 업데이트
        const responseRef = doc(db, 'surveyResponses', savedResponse.id)
        await updateDoc(responseRef, {
          selScores,
          processed: true,
          analysisStatus: 'completed',
          analyzedAt: serverTimestamp()
        })

        analyzedResponses.push({
          id: savedResponse.id,
          studentName: savedResponse.studentName,
          selScores
        })

        console.log('SEL 분석 완료:', { studentName: savedResponse.studentName, selScores })
      } catch (analysisError) {
        console.error('SEL 분석 실패:', { 
          responseId: savedResponse.id, 
          error: analysisError instanceof Error ? analysisError.message : analysisError 
        })
      }
    }

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

// 간단한 SEL 점수 계산 함수
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
      let score = 1 // 기본 점수
      
      // 답변을 점수로 변환 (간단한 로직)
      if (typeof answerValue === 'string') {
        if (answerValue.includes('매우') || answerValue.includes('항상')) {
          score = 5
        } else if (answerValue.includes('자주') || answerValue.includes('잘')) {
          score = 4
        } else if (answerValue.includes('보통') || answerValue.includes('때때로')) {
          score = 3
        } else if (answerValue.includes('가끔') || answerValue.includes('별로')) {
          score = 2
        }
      }
      
      if (selCategories[category as keyof typeof selCategories]) {
        selCategories[category as keyof typeof selCategories].push(score)
      }
    }
  })

  // 카테고리별 평균 점수 계산
  const selScores: Record<string, number> = {}
  Object.entries(selCategories).forEach(([category, scores]) => {
    if (scores.length > 0) {
      selScores[category] = scores.reduce((sum, score) => sum + score, 0) / scores.length
    } else {
      selScores[category] = 3.0 // 기본 점수
    }
  })

  return selScores
}