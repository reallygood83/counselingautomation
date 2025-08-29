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
    
    if (responseData.responseData?.questions) {
      // 새로운 JSON 구조 - SEL 카테고리 매핑
      const responses: Record<string, number> = {}
      const selQuestions: any[] = []
      
      // SEL 카테고리 매핑 (기본값)
      const selCategories = ['selfAwareness', 'selfManagement', 'socialAwareness', 'relationship', 'decisionMaking']
      
      responseData.responseData.questions.forEach((q: any, index: number) => {
        const questionKey = `q${index}`
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
      
      analysisData = { responses, questions: selQuestions }
    } else if (responseData.answers || responseData.originalAnswers) {
      // 기존 구조 - 질문 재구성 필요
      const rawResponses = responseData.originalAnswers || responseData.answers
      const responses: Record<string, number> = {}
      const selQuestions: any[] = []
      const selCategories = ['selfAwareness', 'selfManagement', 'socialAwareness', 'relationship', 'decisionMaking']
      
      Object.entries(rawResponses).forEach(([key, value], index) => {
        const questionKey = `q${index}`
        responses[questionKey] = parseInt(String(value) || '0')
        
        selQuestions.push({
          category: selCategories[index % 5],
          question: `질문 ${index + 1}`,
          options: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'],
          weight: 1
        })
      })
      
      analysisData = { responses, questions: selQuestions }
    } else {
      return NextResponse.json({ error: '분석할 응답 데이터가 없습니다' }, { status: 400 })
    }

    // 학생 정보 추출
    const studentName = responseData.studentInfo?.name || responseData.studentName || '알 수 없음'
    const className = responseData.studentInfo?.class || responseData.className || ''

    // Gemini AI로 SEL 분석 실행
    const geminiClient = new GeminiClient(userApiKey)
    const analysis = await geminiClient.analyzeSelResponses(analysisData.responses, analysisData.questions)

    // 분석 결과로 응답 업데이트
    await updateDoc(responseDocRef, {
      selScores: analysis.scores,
      analysisStatus: 'completed',
      analyzedAt: new Date(),
      aiInsights: analysis.insights,
      recommendations: analysis.recommendations,
      crisisLevel: analysis.crisisLevel,
      totalScore: Object.values(analysis.scores).reduce((sum: any, score: any) => sum + score, 0) / 5
    })

    const summary = {
      totalScore: Object.values(analysis.scores).reduce((sum: any, score: any) => sum + score, 0) / 5,
      strongestArea: Object.entries(analysis.scores).reduce((max: any, [key, value]: [string, any]) => 
        value > max.value ? { area: key, value } : max, 
        { area: '', value: 0 }
      ),
      weakestArea: Object.entries(analysis.scores).reduce((min: any, [key, value]: [string, any]) => 
        value < min.value ? { area: key, value } : min, 
        { area: '', value: 5 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `${studentName} 학생의 응답 분석이 완료되었습니다`,
      analysis: {
        scores: analysis.scores,
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