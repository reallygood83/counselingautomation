'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AuthButton } from '@/components/auth/AuthButton'
import { useSession } from 'next-auth/react'

export default function Settings() {
  const { data: session, status } = useSession()
  const [geminiApiKey, setGeminiApiKey] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [validationMessage, setValidationMessage] = useState('')
  const [isConfigured, setIsConfigured] = useState(false)

  useEffect(() => {
    if (session) {
      checkApiConfiguration()
    }
  }, [session])

  const checkApiConfiguration = async () => {
    try {
      const response = await fetch('/api/user/settings')
      const data = await response.json()
      setIsConfigured(data.hasGeminiApiKey || false)
      if (data.hasGeminiApiKey) {
        setGeminiApiKey('••••••••••••••••••••••••••••••••')
      }
    } catch (error) {
      console.error('API 설정 확인 오류:', error)
    }
  }

  const validateApiKey = async () => {
    if (!geminiApiKey || geminiApiKey.includes('•')) return

    setIsValidating(true)
    setValidationMessage('')

    try {
      const response = await fetch('/api/user/validate-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: geminiApiKey }),
      })

      const data = await response.json()
      
      if (data.valid) {
        setValidationMessage('✅ API 키가 유효합니다!')
        setTimeout(() => setValidationMessage(''), 3000)
      } else {
        setValidationMessage('❌ API 키가 유효하지 않습니다. 다시 확인해주세요.')
      }
    } catch (error) {
      setValidationMessage('❌ API 키 검증 중 오류가 발생했습니다.')
    }

    setIsValidating(false)
  }

  const saveApiKey = async () => {
    if (!geminiApiKey || geminiApiKey.includes('•')) return

    setIsValidating(true)
    try {
      const response = await fetch('/api/user/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ geminiApiKey }),
      })

      const data = await response.json()
      
      if (data.success) {
        setIsConfigured(true)
        setGeminiApiKey('••••••••••••••••••••••••••••••••')
        setValidationMessage('✅ API 키가 안전하게 저장되었습니다!')
        setTimeout(() => setValidationMessage(''), 3000)
      } else {
        setValidationMessage('❌ API 키 저장에 실패했습니다.')
      }
    } catch (error) {
      setValidationMessage('❌ 저장 중 오류가 발생했습니다.')
    }

    setIsValidating(false)
  }

  const clearApiKey = () => {
    setGeminiApiKey('')
    setIsConfigured(false)
    setValidationMessage('')
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">로딩중...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    window.location.href = '/'
    return null
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">M</span>
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-purple-600 bg-clip-text text-transparent">
                  MIRA Settings
                </h1>
              </div>
              <p className="text-gray-600 mt-2">🔮 MIRA의 AI 마음 이해 기능을 활성화하기 위해 Gemini API 키를 설정하세요</p>
            </div>
            <div className="flex items-center gap-4">
              <AuthButton />
              <Button 
                variant="outline"
                onClick={() => window.location.href = '/dashboard'}
              >
                대시보드로 돌아가기
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* API 키 설정 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🤖 Gemini API 설정
                {isConfigured && (
                  <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    설정완료
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gemini API 키
                </label>
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="AIzaSy... (Google AI Studio에서 발급받은 키)"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  API 키는 안전하게 암호화되어 저장됩니다.
                </p>
              </div>

              {validationMessage && (
                <div className={`p-3 rounded-lg ${
                  validationMessage.includes('✅') 
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-red-50 text-red-700'
                }`}>
                  {validationMessage}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={validateApiKey}
                  disabled={isValidating || !geminiApiKey || geminiApiKey.includes('•')}
                  variant="outline"
                  className="flex-1"
                >
                  {isValidating ? '검증 중...' : '키 검증'}
                </Button>
                <Button
                  onClick={saveApiKey}
                  disabled={isValidating || !geminiApiKey || geminiApiKey.includes('•')}
                  className="flex-1"
                >
                  {isValidating ? '저장 중...' : '저장'}
                </Button>
              </div>

              {isConfigured && (
                <Button
                  onClick={clearApiKey}
                  variant="outline"
                  className="w-full text-red-600 hover:bg-red-50"
                >
                  새 API 키 입력
                </Button>
              )}
            </CardContent>
          </Card>

          {/* API 키 발급 가이드 */}
          <Card>
            <CardHeader>
              <CardTitle>🔑 API 키 발급 방법</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Google AI Studio 접속</p>
                    <a 
                      href="https://aistudio.google.com/app/apikey" 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline text-sm"
                    >
                      https://aistudio.google.com/app/apikey
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Google 계정으로 로그인</p>
                    <p className="text-sm text-gray-600">동일한 Google 계정 사용 권장</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium">"Create API Key" 클릭</p>
                    <p className="text-sm text-gray-600">새 프로젝트를 만들거나 기존 프로젝트 선택</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    4
                  </div>
                  <div>
                    <p className="font-medium">API 키 복사</p>
                    <p className="text-sm text-gray-600">AIzaSy로 시작하는 키를 위에 입력</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  <strong>🔒 보안 안내:</strong> API 키는 개인용이므로 타인과 공유하지 마세요. 
                  키는 암호화되어 안전하게 저장됩니다.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">
                  <strong>💡 참고:</strong> Gemini API는 매월 무료 할당량을 제공합니다. 
                  자세한 내용은 Google AI Studio에서 확인하세요.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}