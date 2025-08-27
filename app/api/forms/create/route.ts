import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GoogleFormsClient } from '@/lib/googleForms'

export async function POST(request: NextRequest) {
  console.log('Forms create API called')
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      console.log('No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const survey = await request.json()
    console.log('Survey data received:', JSON.stringify(survey, null, 2))
    
    if (!survey || !survey.title || !survey.questions) {
      console.log('Invalid survey data')
      return NextResponse.json({ 
        error: 'Invalid survey data. Title and questions are required.' 
      }, { status: 400 })
    }

    // session에서 accessToken 가져오기
    const accessToken = (session as any).accessToken
    if (!accessToken) {
      console.log('No access token found in session')
      return NextResponse.json({ 
        error: 'Google API 접근 권한이 없습니다. 다시 로그인해주세요.' 
      }, { status: 401 })
    }

    // Google Forms API 클라이언트 초기화
    const formsClient = new GoogleFormsClient()
    await formsClient.initialize(session.user.email, accessToken)

    console.log('Creating Google Form with title:', survey.title)
    
    // Google Forms 생성
    const formsUrl = await formsClient.createForm({
      title: survey.title,
      description: survey.description || `MIRA SEL 설문 - ${survey.targetGrade} 대상`,
      questions: survey.questions
    })

    console.log('Google Form created successfully:', formsUrl)

    return NextResponse.json({ 
      success: true, 
      formsUrl,
      message: 'Google Forms가 성공적으로 생성되었습니다!'
    })

  } catch (error) {
    console.error('Forms create error:', error)
    
    // 구체적인 에러 메시지 제공
    let errorMessage = 'Google Forms 생성 중 오류가 발생했습니다.'
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'Google Forms API 권한이 필요합니다. 설정에서 API 키를 확인해주세요.'
      } else if (error.message.includes('quota')) {
        errorMessage = 'API 할당량을 초과했습니다. 잠시 후 다시 시도해주세요.'
      } else if (error.message.includes('network')) {
        errorMessage = '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.'
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json({ 
      success: false,
      error: errorMessage 
    }, { status: 500 })
  }
}