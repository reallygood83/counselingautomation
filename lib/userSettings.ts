import { GoogleDriveClient } from './googleDrive'

// 암호화를 위한 간단한 함수 (실제 프로덕션에서는 더 강력한 암호화 사용)
function simpleDecrypt(encryptedText: string): string {
  return Buffer.from(encryptedText, 'base64').toString()
}

// 사용자의 Gemini API 키 조회 (내부 사용)
export async function getGeminiApiKey(accessToken: string): Promise<string | null> {
  try {
    console.log('getGeminiApiKey 시작:', { hasAccessToken: !!accessToken })
    
    const driveClient = new GoogleDriveClient(accessToken)
    console.log('GoogleDriveClient 생성 완료')
    
    const configFile = await driveClient.findFile('counseling-config.json')
    console.log('설정 파일 검색 결과:', { hasConfigFile: !!configFile, fileId: configFile?.id })
    
    if (!configFile) {
      console.log('설정 파일이 존재하지 않음')
      return null
    }
    
    console.log('설정 파일 다운로드 시도 중...')
    const content = await driveClient.downloadFile(configFile.id)
    console.log('설정 파일 다운로드 성공:', { contentLength: content.length })
    
    const config = JSON.parse(content)
    console.log('설정 파일 파싱 성공:', { hasGeminiApiKey: !!config.geminiApiKey })
    
    if (config.geminiApiKey) {
      const decryptedKey = simpleDecrypt(config.geminiApiKey)
      console.log('API 키 복호화 성공:', { keyPrefix: decryptedKey.substring(0, 10) + '...' })
      return decryptedKey
    }
    
    console.log('설정 파일에 Gemini API 키가 없음')
    return null
  } catch (error) {
    console.error('Gemini API 키 조회 오류 상세:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    return null
  }
}