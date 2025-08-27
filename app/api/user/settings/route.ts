import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { GoogleDriveClient } from '@/lib/googleDrive'

// 암호화를 위한 간단한 함수 (실제 프로덕션에서는 더 강력한 암호화 사용)
function simpleEncrypt(text: string): string {
  return Buffer.from(text).toString('base64')
}

function simpleDecrypt(encryptedText: string): string {
  return Buffer.from(encryptedText, 'base64').toString()
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    console.log('GET /api/user/settings - 세션 상태:', { 
      hasSession: !!session, 
      hasAccessToken: !!session?.accessToken,
      sessionError: session?.error 
    })
    
    if (!session?.accessToken) {
      console.error('GET /api/user/settings - AccessToken 없음')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const driveClient = new GoogleDriveClient(session.accessToken)
    
    try {
      // 설정 파일에서 API 키 존재 여부 확인
      const configFile = await driveClient.findFile('counseling-config.json')
      
      if (configFile) {
        const content = await driveClient.downloadFile(configFile.id)
        const config = JSON.parse(content)
        
        return NextResponse.json({
          hasGeminiApiKey: !!config.geminiApiKey,
          lastUpdated: config.lastUpdated
        })
      } else {
        return NextResponse.json({
          hasGeminiApiKey: false
        })
      }
    } catch (error) {
      return NextResponse.json({
        hasGeminiApiKey: false
      })
    }
  } catch (error) {
    console.error('설정 조회 오류:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    console.log('POST /api/user/settings - 세션 상태:', { 
      hasSession: !!session, 
      hasAccessToken: !!session?.accessToken,
      sessionError: session?.error 
    })
    
    if (!session?.accessToken) {
      console.error('POST /api/user/settings - AccessToken 없음')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { geminiApiKey } = await request.json()
    console.log('POST /api/user/settings - API 키 수신됨:', { 
      hasApiKey: !!geminiApiKey,
      keyPrefix: geminiApiKey?.substring(0, 10) + '...' 
    })
    
    if (!geminiApiKey || !geminiApiKey.startsWith('AIzaSy')) {
      return NextResponse.json({ error: 'Invalid API key format' }, { status: 400 })
    }

    const driveClient = new GoogleDriveClient(session.accessToken)
    
    // 기존 설정 파일 찾기 또는 새로 생성
    let configFile = await driveClient.findFile('counseling-config.json')
    let config: any = {}
    
    if (configFile) {
      try {
        const existingContent = await driveClient.downloadFile(configFile.id)
        config = JSON.parse(existingContent)
      } catch (error) {
        console.log('기존 설정 파일 파싱 실패, 새로 생성합니다.')
      }
    }
    
    // API 키 암호화 저장
    config.geminiApiKey = simpleEncrypt(geminiApiKey)
    config.lastUpdated = new Date().toISOString()
    
    const configJson = JSON.stringify(config, null, 2)
    
    if (configFile) {
      // 기존 파일 업데이트
      await driveClient.updateFile(configFile.id, configJson, 'application/json')
    } else {
      // 새 파일 생성
      await driveClient.uploadFile('counseling-config.json', configJson, 'application/json')
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('설정 저장 오류:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

