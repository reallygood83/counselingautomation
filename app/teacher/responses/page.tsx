'use client'

import { useState } from 'react'
import { ResponseViewer } from '@/components/teacher/ResponseViewer'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function ResponsesPage() {
  const [formId, setFormId] = useState('')
  const [formTitle, setFormTitle] = useState('')
  const [showViewer, setShowViewer] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formId.trim()) {
      setShowViewer(true)
    }
  }

  const extractFormId = (input: string) => {
    // URL에서 Form ID 추출
    const urlMatch = input.match(/\/forms\/d\/([a-zA-Z0-9-_]+)/)
    if (urlMatch) {
      return urlMatch[1]
    }
    // 직접 ID 입력인 경우
    return input.trim()
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {!showViewer ? (
        // Form ID 입력 화면
        <div className="max-w-2xl mx-auto">
          <Card className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">📋 설문 응답 확인</h1>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Google Forms ID 또는 URL
                </label>
                <input
                  type="text"
                  value={formId}
                  onChange={(e) => setFormId(extractFormId(e.target.value))}
                  placeholder="Forms URL을 붙여넣거나 Form ID를 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  예: https://docs.google.com/forms/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  설문 제목 (선택사항)
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="설문지 제목을 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <Button type="submit" className="w-full" size="lg">
                📊 응답 확인하기
              </Button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="font-semibold text-blue-900 mb-2">💡 사용 방법</h3>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. 배포한 Google Forms의 URL을 복사하세요</li>
                <li>2. 위 입력란에 URL을 붙여넣으면 자동으로 Form ID가 추출됩니다</li>
                <li>3. "응답 확인하기" 버튼을 클릭하세요</li>
                <li>4. 학생들의 응답을 확인하고 Firebase에 저장할 수 있습니다</li>
              </ol>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <h3 className="font-semibold text-yellow-900 mb-2">⚠️ 주의사항</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Google Forms API 권한이 필요합니다</li>
                <li>• 매칭 실패한 응답은 학생 등록 후 다시 처리해주세요</li>
                <li>• 응답 데이터는 Firebase에 안전하게 저장됩니다</li>
              </ul>
            </div>
          </Card>
        </div>
      ) : (
        // 응답 확인 화면
        <div>
          <div className="mb-4">
            <Button 
              onClick={() => setShowViewer(false)}
              className="bg-gray-500 hover:bg-gray-600"
            >
              ← 다른 설문 확인하기
            </Button>
          </div>
          <ResponseViewer formId={formId} formTitle={formTitle || undefined} />
        </div>
      )}
    </div>
  )
}