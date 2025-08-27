// Google Drive API 클라이언트
export class GoogleDriveClient {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  // 사용자의 Google Drive에 폴더 생성 (상담 자료용)
  async createFolder(name: string, parentId?: string) {
    console.log('Google Drive createFolder 시도:', { name, hasParentId: !!parentId, hasAccessToken: !!this.accessToken })
    
    const response = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        mimeType: 'application/vnd.google-apps.folder',
        ...(parentId && { parents: [parentId] })
      })
    })

    console.log('Google Drive createFolder 응답:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Google Drive createFolder 오류 상세:', errorText)
      throw new Error(`Failed to create folder: ${response.statusText} - ${errorText}`)
    }

    const result = await response.json()
    console.log('Google Drive createFolder 성공:', { id: result.id, name: result.name })
    return result
  }

  // 스프레드시트 생성 (학생 데이터용)
  async createSpreadsheet(title: string, parentId?: string) {
    console.log('Google Drive createSpreadsheet 시도:', { title, hasParentId: !!parentId, hasAccessToken: !!this.accessToken })
    
    const response = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: title,
        mimeType: 'application/vnd.google-apps.spreadsheet',
        ...(parentId && { parents: [parentId] })
      })
    })

    console.log('Google Drive createSpreadsheet 응답:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Google Drive createSpreadsheet 오류 상세:', errorText)
      throw new Error(`Failed to create spreadsheet: ${response.statusText} - ${errorText}`)
    }

    const result = await response.json()
    console.log('Google Drive createSpreadsheet 성공:', { id: result.id, name: result.name })
    return result
  }

  // 파일 업로드 (보고서 등)
  async uploadFile(name: string, content: string, mimeType: string, parentId?: string) {
    console.log('Google Drive uploadFile 시도:', { name, mimeType, hasParentId: !!parentId })
    
    const metadata = {
      name,
      mimeType,
      ...(parentId && { parents: [parentId] })
    }

    const form = new FormData()
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    form.append('file', new Blob([content], { type: mimeType }))

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
      body: form
    })

    console.log('Google Drive uploadFile 응답:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Google Drive uploadFile 오류 상세:', errorText)
      throw new Error(`Failed to upload file: ${response.statusText} - ${errorText}`)
    }

    return response.json()
  }

  // 폴더 내 파일 목록 조회
  async listFiles(folderId?: string) {
    const query = folderId ? `'${folderId}' in parents` : ''
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,createdTime)`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to list files: ${response.statusText}`)
    }

    return response.json()
  }

  // 상담자동화 루트 폴더 찾기 또는 생성
  async ensureCounselingFolder() {
    // 기존 폴더 찾기
    const existingFolder = await this.findFolder('상담자동화')
    if (existingFolder) {
      return existingFolder
    }

    // 없으면 새로 생성
    return await this.createFolder('상담자동화')
  }

  // 폴더 찾기
  async findFolder(name: string) {
    console.log('Google Drive findFolder 시도:', { name, hasAccessToken: !!this.accessToken })
    
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${name}' and mimeType='application/vnd.google-apps.folder'&fields=files(id,name)`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        }
      }
    )

    console.log('Google Drive findFolder 응답:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Google Drive findFolder 오류 상세:', errorText)
      throw new Error(`Failed to find folder: ${response.statusText} - ${errorText}`)
    }

    const data = await response.json()
    console.log('Google Drive findFolder 결과:', { found: !!data.files?.[0], filesCount: data.files?.length })
    return data.files?.[0] || null
  }

  // 파일 찾기
  async findFile(name: string) {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${name}'&fields=files(id,name)`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        }
      }
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.files?.[0] || null
  }

  // 파일 다운로드
  async downloadFile(fileId: string) {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`)
    }

    return response.text()
  }

  // 파일 업데이트
  async updateFile(fileId: string, content: string, mimeType: string) {
    const response = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': mimeType,
        },
        body: content
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to update file: ${response.statusText}`)
    }

    return response.json()
  }
}