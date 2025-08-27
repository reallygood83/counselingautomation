import { GoogleDriveClient } from './googleDrive'

// 암호화를 위한 간단한 함수 (실제 프로덕션에서는 더 강력한 암호화 사용)
function simpleDecrypt(encryptedText: string): string {
  return Buffer.from(encryptedText, 'base64').toString()
}

// 사용자의 Gemini API 키 조회 (내부 사용)
export async function getGeminiApiKey(accessToken: string): Promise<string | null> {
  try {
    const driveClient = new GoogleDriveClient(accessToken)
    const configFile = await driveClient.findFile('counseling-config.json')
    
    if (!configFile) return null
    
    const content = await driveClient.downloadFile(configFile.id)
    const config = JSON.parse(content)
    
    if (config.geminiApiKey) {
      return simpleDecrypt(config.geminiApiKey)
    }
    
    return null
  } catch (error) {
    console.error('Gemini API 키 조회 오류:', error)
    return null
  }
}