import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GeminiClient } from '@/lib/gemini'
import { getGeminiApiKey } from '@/lib/userSettings'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { targetGrade, studentName, focusAreas, difficultyLevel = 'standard' } = body

    if (!targetGrade) {
      return NextResponse.json(
        { error: '대상 학년을 입력해주세요.' },
        { status: 400 }
      )
    }

    // 사용자의 Gemini API 키 조회
    const userApiKey = await getGeminiApiKey(session.accessToken)
    if (!userApiKey) {
      return NextResponse.json(
        { error: 'Gemini API 키가 설정되지 않았습니다. 설정 페이지에서 API 키를 등록해주세요.' },
        { status: 400 }
      )
    }

    // Gemini AI로 설문 문항 생성
    const geminiClient = new GeminiClient(userApiKey)
    const questions = await geminiClient.generateSelQuestions({
      targetGrade,
      studentName,
      focusAreas,
      difficultyLevel
    })

    // 생성된 설문 정보 반환
    return NextResponse.json({
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
        createdAt: new Date().toISOString(),
        status: 'draft'
      }
    })

  } catch (error) {
    console.error('설문 생성 오류:', error)
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