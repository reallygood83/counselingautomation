import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { GoogleDriveClient } from '@/lib/googleDrive'
import { GoogleSheetsClient } from '@/lib/googleSheets'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // Google Drive 및 Sheets 클라이언트 초기화
    const driveClient = new GoogleDriveClient(session.accessToken)
    const sheetsClient = new GoogleSheetsClient(session.accessToken)

    // 1. 상담자동화 루트 폴더 확인 또는 생성
    const counselingFolder = await driveClient.ensureCounselingFolder()
    
    // 2. 학생 데이터 스프레드시트 생성
    const spreadsheet = await driveClient.createSpreadsheet(
      '학생 상담 데이터',
      counselingFolder.id
    )
    
    // 3. 스프레드시트 초기 구조 설정
    const initResult = await sheetsClient.initializeStudentData(spreadsheet.id)

    return NextResponse.json({
      success: true,
      data: {
        counselingFolderId: counselingFolder.id,
        spreadsheetId: spreadsheet.id,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheet.id}/edit`,
        headers: initResult.headers
      }
    })

  } catch (error) {
    console.error('사용자 초기화 오류:', error)
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