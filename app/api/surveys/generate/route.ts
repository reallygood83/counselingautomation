import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GeminiClient } from '@/lib/gemini'
import { getGeminiApiKey } from '@/lib/userSettings'

// 동적 API 라우트로 설정
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    console.log('POST /api/surveys/generate - 세션 상태:', { 
      hasSession: !!session, 
      hasAccessToken: !!session?.accessToken,
      sessionError: session?.error 
    })
    
    if (!session?.accessToken) {
      console.error('POST /api/surveys/generate - AccessToken 없음')
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      targetGrade, 
      studentName, 
      focusAreas, 
      difficultyLevel = 'standard',
      includeStudentFields = true, // 학생 식별 필드 포함 여부
      classNames = [] // 학급 목록
    } = body
    console.log('POST /api/surveys/generate - 요청 데이터:', {
      targetGrade, 
      studentName, 
      focusAreas, 
      difficultyLevel,
      includeStudentFields,
      classNames
    })

    if (!targetGrade) {
      console.error('POST /api/surveys/generate - targetGrade 없음')
      return NextResponse.json(
        { error: '대상 학년을 입력해주세요.' },
        { status: 400 }
      )
    }

    try {
      // 사용자의 Gemini API 키 조회
      console.log('1단계: Gemini API 키 조회 시도 중...')
      const userApiKey = await getGeminiApiKey(session.accessToken)
      console.log('Gemini API 키 조회 결과:', { hasApiKey: !!userApiKey })
      
      if (!userApiKey) {
        console.error('Gemini API 키 없음')
        return NextResponse.json(
          { error: 'Gemini API 키가 설정되지 않았습니다. 설정 페이지에서 API 키를 등록해주세요.' },
          { status: 400 }
        )
      }

      // Gemini AI로 설문 문항 생성
      console.log('2단계: Gemini AI 설문 문항 생성 시도 중...')
      const geminiClient = new GeminiClient(userApiKey)
      const questions = await geminiClient.generateSelQuestions({
        targetGrade,
        studentName,
        focusAreas,
        difficultyLevel
      })
      console.log('설문 문항 생성 성공:', { questionsCount: questions.length })

      const result = {
        success: true,
        survey: {
          id: `survey-${Date.now()}`,
          title: `${targetGrade} SEL 설문조사${studentName ? ` - ${studentName}` : ''}`,
          description: '사회정서학습(SEL) 평가를 위한 설문입니다. 솔직하게 답변해주세요.',
          targetGrade,
          studentName,
          focusAreas,
          difficultyLevel,
          questions,
          includeStudentFields,
          classNames,
          createdAt: new Date().toISOString(),
          status: 'draft'
        }
      }

      console.log('설문 생성 완료 - 반환 데이터:', {
        surveyId: result.survey.id,
        title: result.survey.title,
        questionsCount: result.survey.questions.length
      })
      return NextResponse.json(result)

    } catch (stepError) {
      const error = stepError instanceof Error ? stepError : new Error(String(stepError))
      console.error('설문 생성 단계별 오류 상세:', {
        error: error.message,
        stack: error.stack,
        name: error.name
      })
      
      // 구체적인 오류 메시지 제공
      let errorMessage = '설문 생성 중 오류가 발생했습니다.'
      if (error.message.includes('Forbidden')) {
        errorMessage = 'Google Drive 접근 권한이 부족합니다. 다시 로그인해주세요.'
      } else if (error.message.includes('API key')) {
        errorMessage = 'Gemini API 키 설정에 문제가 있습니다. 설정을 확인해주세요.'
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: error.message
        },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('설문 생성 전체 오류:', error)
    return NextResponse.json(
      { error: '설문 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 기존 설문 목록 조회
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 여기서는 임시로 빈 배열 반환
    // 실제로는 사용자의 Google Drive에서 설문 목록을 조회
    return NextResponse.json({
      surveys: []
    })

  } catch (error) {
    console.error('설문 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '설문 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}