import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GoogleFormsClient } from '@/lib/googleForms'
import { db } from '@/lib/firebase'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || !session.accessToken) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { surveyId, survey } = body

    if (!survey) {
      return NextResponse.json(
        { error: '배포할 설문 데이터가 필요합니다.' },
        { status: 400 }
      )
    }

    console.log('설문 배포 시작:', { surveyId, title: survey.title })

    // Google Forms 클라이언트 초기화
    const formsClient = new GoogleFormsClient()
    await formsClient.initialize(session.user.email, session.accessToken)

    // 설문 데이터를 Google Forms API 형식으로 변환
    const formData = {
      title: survey.title,
      description: survey.description,
      questions: survey.questions || [],
      includeStudentFields: survey.includeStudentFields !== false, // 기본값 true
      classNames: survey.classNames || []
    }

    console.log('Forms 생성 데이터:', {
      title: formData.title,
      questionsCount: formData.questions.length,
      includeStudentFields: formData.includeStudentFields,
      classNamesCount: formData.classNames.length
    })

    // Google Forms 생성
    const formsUrl = await formsClient.createForm(formData)
    
    // Forms ID 추출 (URL에서)
    const formIdMatch = formsUrl.match(/\/forms\/d\/([a-zA-Z0-9-_]+)/)
    const formId = formIdMatch ? formIdMatch[1] : null

    console.log('Google Forms 생성 완료:', { formsUrl, formId })

    // Firebase에 배포 정보 업데이트 (surveyId가 있는 경우에만)
    if (surveyId) {
      try {
        const surveyRef = doc(db, 'surveys', surveyId)
        await updateDoc(surveyRef, {
          status: 'deployed',
          formsUrl: formsUrl,
          formId: formId,
          deployedAt: serverTimestamp(),
          responseCount: 0
        })
        console.log('Firebase 설문 상태 업데이트 완료')
      } catch (updateError) {
        console.error('Firebase 업데이트 오류:', updateError)
        // Firebase 업데이트 실패해도 Forms는 생성되었으므로 계속 진행
      }
    }

    return NextResponse.json({
      success: true,
      formsUrl,
      formId,
      message: 'Google Forms가 성공적으로 생성되었습니다.',
      deploymentInfo: {
        formTitle: survey.title,
        questionsCount: survey.questions?.length || 0,
        studentFieldsIncluded: formData.includeStudentFields,
        classOptions: formData.classNames.length,
        deployedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('설문 배포 오류:', error)
    
    let errorMessage = '설문 배포 중 오류가 발생했습니다.'
    
    if (error instanceof Error) {
      if (error.message.includes('403') || error.message.includes('Forbidden')) {
        errorMessage = 'Google Forms API 권한이 없습니다. Google Cloud Console에서 Forms API를 활성화해주세요.'
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        errorMessage = 'Google Forms API 인증에 실패했습니다. 다시 로그인해주세요.'
      } else if (error.message.includes('quota')) {
        errorMessage = 'Google Forms API 할당량을 초과했습니다.'
      } else {
        errorMessage = `설문 배포 실패: ${error.message}`
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

// 배포된 설문 목록 조회 (선택적)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // Firebase에서 배포된 설문 목록 조회하는 로직 (필요시 구현)
    return NextResponse.json({
      success: true,
      message: '배포된 설문 조회 기능은 구현 예정입니다.'
    })

  } catch (error) {
    console.error('배포된 설문 조회 오류:', error)
    return NextResponse.json(
      { error: '배포된 설문 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}