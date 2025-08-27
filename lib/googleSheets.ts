// Google Sheets API 클라이언트
export class GoogleSheetsClient {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  // 스프레드시트에 데이터 입력
  async writeToSheet(spreadsheetId: string, range: string, values: any[][]) {
    console.log('Google Sheets writeToSheet 시도:', { 
      spreadsheetId, 
      range, 
      valuesCount: values.length,
      hasAccessToken: !!this.accessToken 
    })
    
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values })
      }
    )

    console.log('Google Sheets writeToSheet 응답:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Google Sheets writeToSheet 오류 상세:', errorText)
      throw new Error(`Failed to write to sheet: ${response.statusText} - ${errorText}`)
    }

    return response.json()
  }

  // 스프레드시트에서 데이터 읽기
  async readFromSheet(spreadsheetId: string, range: string) {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to read from sheet: ${response.statusText}`)
    }

    return response.json()
  }

  // 스프레드시트에 데이터 추가 (append)
  async appendToSheet(spreadsheetId: string, range: string, values: any[][]) {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=RAW`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values })
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to append to sheet: ${response.statusText}`)
    }

    return response.json()
  }

  // 새 워크시트 생성
  async createSheet(spreadsheetId: string, title: string) {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [{
            addSheet: {
              properties: { title }
            }
          }]
        })
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to create sheet: ${response.statusText}`)
    }

    return response.json()
  }

  // 학생 데이터 초기화 (기본 구조 생성)
  async initializeStudentData(spreadsheetId: string) {
    console.log('Google Sheets 초기화 시작:', { spreadsheetId })
    
    const headers = [
      '학생명', '학급', '설문날짜', 
      '자기인식', '자기관리', '사회인식', '관계기술', '의사결정',
      '위기수준', '특이사항', '상담필요'
    ]
    console.log('헤더 데이터 준비 완료:', headers)

    try {
      await this.writeToSheet(spreadsheetId, 'A1:K1', [headers])
      console.log('Google Sheets 헤더 작성 성공')
    } catch (error) {
      console.error('Google Sheets 헤더 작성 실패:', error)
      throw new Error(`스프레드시트 초기화 실패: ${error.message}`)
    }
    
    return { success: true, headers }
  }

  // SEL 분석 결과 저장
  async saveSelAnalysis(
    spreadsheetId: string, 
    studentName: string,
    className: string,
    selScores: {
      selfAwareness: number
      selfManagement: number
      socialAwareness: number
      relationship: number
      decisionMaking: number
    },
    crisisLevel: string,
    notes?: string
  ) {
    const row = [
      studentName,
      className,
      new Date().toLocaleDateString('ko-KR'),
      selScores.selfAwareness,
      selScores.selfManagement,
      selScores.socialAwareness,
      selScores.relationship,
      selScores.decisionMaking,
      crisisLevel,
      notes || '',
      crisisLevel === 'warning' || crisisLevel === 'critical' ? '필요' : '일반'
    ]

    await this.appendToSheet(spreadsheetId, 'A:K', [row])
    
    return { success: true, data: row }
  }
}