import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GoogleDriveClient } from '@/lib/googleDrive'
import { GoogleSheetsClient } from '@/lib/googleSheets'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    console.log('POST /api/user/initialize - 세션 상태:', { 
      hasSession: !!session, 
      hasAccessToken: !!session?.accessToken,
      sessionError: session?.error 
    })
    
    if (!session?.accessToken) {
      console.error('POST /api/user/initialize - AccessToken 없음')
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // Google Drive 및 Sheets 클라이언트 초기화
    const driveClient = new GoogleDriveClient(session.accessToken)
    const sheetsClient = new GoogleSheetsClient(session.accessToken)
    console.log('클라이언트 초기화 완료')

    try {
      // 1. 상담자동화 루트 폴더 확인 또는 생성
      console.log('1단계: 상담자동화 폴더 생성 시도 중...')
      const counselingFolder = await driveClient.ensureCounselingFolder()
      console.log('상담자동화 폴더 생성/확인 성공:', {
        id: counselingFolder.id,
        name: counselingFolder.name
      })
      
      // 2. 학생 데이터 스프레드시트 생성
      console.log('2단계: 스프레드시트 생성 시도 중...')
      const spreadsheet = await driveClient.createSpreadsheet(
        '학생 상담 데이터',
        counselingFolder.id
      )
      console.log('스프레드시트 생성 성공:', {
        id: spreadsheet.id,
        name: spreadsheet.name
      })
      
      // 3. 스프레드시트 초기 구조 설정
      console.log('3단계: 스프레드시트 초기화 시도 중...')
      const initResult = await sheetsClient.initializeStudentData(spreadsheet.id)
      console.log('스프레드시트 초기화 성공:', initResult)

      const result = {
        success: true,
        data: {
          counselingFolderId: counselingFolder.id,
          spreadsheetId: spreadsheet.id,
          spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheet.id}/edit`,
          headers: initResult.headers
        }
      }
      
      console.log('초기화 완료 - 반환 데이터:', result)
      return NextResponse.json(result)

    } catch (stepError) {
      const error = stepError instanceof Error ? stepError : new Error(String(stepError))
      
      console.error('초기화 단계별 오류 상세:', {
        error: error.message,
        stack: error.stack,
        name: error.name
      })
      
      // 구체적인 오류 메시지 제공
      let errorMessage = '초기화 중 오류가 발생했습니다.'
      if (error.message.includes('Forbidden')) {
        errorMessage = 'Google Drive 접근 권한이 부족합니다. 다시 로그인해주세요.'
      } else if (error.message.includes('Failed to create')) {
        errorMessage = 'Google Drive 파일 생성에 실패했습니다.'
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
    console.error('사용자 초기화 전체 오류:', error)
    return NextResponse.json(
      { error: '초기화 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 사용자 데이터 상태 확인
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const driveClient = new GoogleDriveClient(session.accessToken)
    
    // 상담자동화 폴더 존재 여부 확인
    const counselingFolder = await driveClient.findFolder('상담자동화')
    
    if (!counselingFolder) {
      return NextResponse.json({
        initialized: false,
        message: '초기 설정이 필요합니다.'
      })
    }

    // 폴더 내 파일 목록 조회
    const files = await driveClient.listFiles(counselingFolder.id)
    
    return NextResponse.json({
      initialized: true,
      counselingFolderId: counselingFolder.id,
      files: files.files
    })

  } catch (error) {
    console.error('상태 확인 오류:', error)
    return NextResponse.json(
      { error: '상태 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}