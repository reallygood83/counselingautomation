import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/firebase'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { GeminiClient } from '@/lib/gemini'
import { getGeminiApiKey } from '@/lib/userSettings'

export async function POST(
  request: NextRequest,
  { params }: { params: { surveyId: string } }
) {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { responseId } = await request.json()

    if (!responseId) {
      return NextResponse.json({ error: '응답 ID가 필요합니다' }, { status: 400 })
    }

    // 응답 문서 조회
    const responseDocRef = doc(db, 'surveyResponses', responseId)
    const responseDoc = await getDoc(responseDocRef)

    if (!responseDoc.exists()) {
      return NextResponse.json({ error: '응답을 찾을 수 없습니다' }, { status: 404 })
    }

    const responseData = responseDoc.data()
    
    // 실제 데이터 구조 로깅
    console.log('=== 실제 응답 데이터 구조 확인 ===')
    console.log('전체 데이터 키들:', Object.keys(responseData))
    console.log('responseData:', JSON.stringify(responseData, null, 2))
    
    // 교사 권한 확인
    if (responseData.teacherEmail !== session.user.email) {
      return NextResponse.json({ error: '분석 권한이 없습니다' }, { status: 403 })
    }

    // 사용자의 Gemini API 키 조회
    const userApiKey = await getGeminiApiKey(session.accessToken || '')
    if (!userApiKey) {
      return NextResponse.json(
        { error: 'Gemini API 키가 설정되지 않았습니다. 설정 페이지에서 API 키를 등록해주세요.' },
        { status: 400 }
      )
    }

    // 응답 데이터 추출 (새/기존 구조 호환)
    let analysisData: any = {}
    
    console.log('=== 응답 데이터 구조 분석 ===')
    console.log('responseData.responseData 존재:', !!responseData.responseData)
    console.log('responseData.responseData?.questions 존재:', !!responseData.responseData?.questions)
    console.log('responseData.answers 존재:', !!responseData.answers)
    console.log('responseData.originalAnswers 존재:', !!responseData.originalAnswers)
    
    if (responseData.responseData?.questions) {
      console.log('새로운 JSON 구조 사용')
      console.log('questions 배열 길이:', responseData.responseData.questions.length)
      console.log('첫 번째 질문 구조:', JSON.stringify(responseData.responseData.questions[0], null, 2))
      
      // 새로운 JSON 구조 - SEL 카테고리 매핑
      const responses: Record<string, number> = {}
      const selQuestions: any[] = []
      
      // SEL 카테고리 매핑 (기본값)
      const selCategories = ['selfAwareness', 'selfManagement', 'socialAwareness', 'relationship', 'decisionMaking']
      
      responseData.responseData.questions.forEach((q: any, index: number) => {
        const questionKey = `q${index}`
        console.log(`질문 ${index}:`, {
          questionTitle: q.questionTitle,
          answer: q.answer,
          answerValue: q.answerValue,
          originalValue: q.answer || q.answerValue
        })
        
        const answerValue = parseInt(q.answer || q.answerValue || '0')
        responses[questionKey] = answerValue
        
        // SEL 질문 구조 생성
        selQuestions.push({
          category: selCategories[index % 5], // 5개 카테고리 순환
          question: q.questionTitle || `질문 ${index + 1}`,
          options: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'],
          weight: 1
        })
      })
      
      console.log('생성된 responses:', responses)
      console.log('생성된 selQuestions 개수:', selQuestions.length)
      
      analysisData = { responses, questions: selQuestions }
    } else if (responseData.answers || responseData.originalAnswers) {
      console.log('기존 구조 사용')
      // 기존 구조 - 질문 재구성 필요
      const rawResponses = responseData.originalAnswers || responseData.answers
      console.log('rawResponses:', JSON.stringify(rawResponses, null, 2))
      
      const responses: Record<string, number> = {}
      const selQuestions: any[] = []
      const selCategories = ['selfAwareness', 'selfManagement', 'socialAwareness', 'relationship', 'decisionMaking']
      
      Object.entries(rawResponses).forEach(([key, value], index) => {
        const questionKey = `q${index}`
        const parsedValue = parseInt(String(value) || '0')
        console.log(`기존 구조 질문 ${index} (${key}): ${value} -> ${parsedValue}`)
        responses[questionKey] = parsedValue
        
        selQuestions.push({
          category: selCategories[index % 5],
          question: `질문 ${index + 1}`,
          options: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'],
          weight: 1
        })
      })
      
      console.log('기존 구조 - 생성된 responses:', responses)
      analysisData = { responses, questions: selQuestions }
    } else {
      console.error('분석할 데이터가 없습니다!')
      console.log('사용 가능한 키들:', Object.keys(responseData))
      return NextResponse.json({ error: '분석할 응답 데이터가 없습니다' }, { status: 400 })
    }

    // 학생 정보 추출
    const studentName = responseData.studentInfo?.name || responseData.studentName || '알 수 없음'
    const className = responseData.studentInfo?.class || responseData.className || ''

    // 분석 데이터 디버깅 로그
    console.log('분석 데이터 확인:', {
      responsesKeys: Object.keys(analysisData.responses),
      responsesValues: Object.values(analysisData.responses),
      questionsCount: analysisData.questions.length,
      questionsCategories: analysisData.questions.map((q: any) => q.category)
    })

    // Gemini AI로 SEL 분석 실행
    console.log('=== Gemini 분석 시작 ===')
    console.log('API 키 존재:', !!userApiKey)
    
    let analysis
    try {
      const geminiClient = new GeminiClient(userApiKey)
      analysis = await geminiClient.analyzeSelResponses(analysisData.responses, analysisData.questions)
      console.log('Gemini 분석 성공!')
    } catch (geminiError) {
      console.error('Gemini 분석 중 오류:', geminiError)
      throw new Error(`Gemini 분석 실패: ${geminiError instanceof Error ? geminiError.message : String(geminiError)}`)
    }
    
    console.log('Gemini 분석 결과:', {
      scores: analysis.scores,
      scoresDetail: JSON.stringify(analysis.scores),
      hasInsights: !!analysis.insights,
      hasRecommendations: !!analysis.recommendations,
      crisisLevel: analysis.crisisLevel
    })
    
    // 점수 검증 및 기본값 설정
    const validatedScores = {
      selfAwareness: analysis.scores.selfAwareness || 2.5,
      selfManagement: analysis.scores.selfManagement || 2.5,
      socialAwareness: analysis.scores.socialAwareness || 2.5,
      relationship: analysis.scores.relationship || 2.5,
      decisionMaking: analysis.scores.decisionMaking || 2.5
    }
    
    console.log('검증된 점수:', validatedScores)

    // 분석 결과로 응답 업데이트 (검증된 점수 사용)
    await updateDoc(responseDocRef, {
      selScores: validatedScores,
      analysisStatus: 'completed',
      analyzedAt: new Date(),
      aiInsights: analysis.insights,
      recommendations: analysis.recommendations,
      crisisLevel: analysis.crisisLevel,
      totalScore: Object.values(validatedScores).reduce((sum, score) => sum + score, 0) / 5
    })

    const summary = {
      totalScore: Object.values(validatedScores).reduce((sum, score) => sum + score, 0) / 5,
      strongestArea: Object.entries(validatedScores).reduce((max: any, [key, value]: [string, any]) => 
        value > max.value ? { area: key, value } : max, 
        { area: '', value: 0 }
      ),
      weakestArea: Object.entries(validatedScores).reduce((min: any, [key, value]: [string, any]) => 
        value < min.value ? { area: key, value } : min, 
        { area: '', value: 5 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `${studentName} 학생의 응답 분석이 완료되었습니다`,
      analysis: {
        scores: validatedScores,
        insights: analysis.insights,
        recommendations: analysis.recommendations,
        crisisLevel: analysis.crisisLevel,
        summary,
        analyzedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('개별 응답 분석 중 오류:', error)
    return NextResponse.json(
      { error: '응답 분석 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}