'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AuthGuard } from '@/components/auth/AuthButton'
import { SurveyGenerator } from '@/components/surveys/SurveyGenerator'
import { SurveyPreviewModal } from '@/components/surveys/SurveyPreviewModal'
import Link from 'next/link'

export default function SurveysPage() {
  const [currentView, setCurrentView] = useState<'list' | 'generate'>('list')
  const [surveys, setSurveys] = useState<any[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [selectedSurvey, setSelectedSurvey] = useState<any>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    checkInitialization()
  }, [])

  const checkInitialization = async () => {
    try {
      const response = await fetch('/api/user/initialize')
      const data = await response.json()
      setIsInitialized(data.initialized)
    } catch (error) {
      console.error('초기화 상태 확인 오류:', error)
    }
  }

  const initializeUser = async () => {
    setIsInitializing(true)
    try {
      const response = await fetch('/api/user/initialize', { method: 'POST' })
      const data = await response.json()
      
      if (data.success) {
        setIsInitialized(true)
        alert('Google Drive 설정이 완료되었습니다!')
      }
    } catch (error) {
      console.error('초기화 오류:', error)
      alert('초기화 중 오류가 발생했습니다.')
    } finally {
      setIsInitializing(false)
    }
  }

  const handleSurveyGenerated = (survey: any) => {
    setSurveys(prev => [survey, ...prev])
    setCurrentView('list')
  }

  const handlePreview = (survey: any) => {
    setSelectedSurvey(survey)
    setShowPreview(true)
  }

  const handleDeployToForms = async (survey: any) => {
    try {
      const response = await fetch('/api/forms/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(survey)
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Google Forms URL로 이동
        window.open(data.formsUrl, '_blank')
        alert('Google Forms가 성공적으로 생성되었습니다!')
      } else {
        alert('Forms 생성에 실패했습니다: ' + data.error)
      }
    } catch (error) {
      console.error('Forms 배포 오류:', error)
      alert('Forms 배포 중 오류가 발생했습니다.')
    }
  }

  if (!isInitialized) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-white">🧠</span>
              </div>
              <CardTitle>MIRA 초기 설정</CardTitle>
              <p className="text-gray-600 text-sm">
                Google Drive에 상담 데이터 저장 공간을 준비합니다
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-teal-50 to-purple-50 p-4 rounded-lg border border-teal-200">
                  <h4 className="font-medium text-teal-900 mb-2">🔮 MIRA가 준비할 항목:</h4>
                  <ul className="text-sm text-teal-700 space-y-1">
                    <li>✨ 'MIRA 상담자동화' 폴더</li>
                    <li>💾 '학생 SEL 데이터' 스프레드시트</li>
                    <li>🛡️ 개인 데이터 보안 설정</li>
                    <li>🧠 감정 분석 AI 연동</li>
                  </ul>
                </div>
                
                <Button 
                  onClick={initializeUser} 
                  disabled={isInitializing}
                  className="w-full"
                  size="lg"
                >
                  {isInitializing ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      설정 중...
                    </div>
                  ) : (
                    '🔮 MIRA 설정 시작하기'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <Link href="/dashboard" className="flex items-center gap-3 mb-2 hover:opacity-80 transition-opacity cursor-pointer">
                  <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">M</span>
                  </div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-purple-600 bg-clip-text text-transparent">
                    MIRA SEL Manager
                  </h1>
                </Link>
                <p className="text-gray-600 mt-2">학생의 내면과 감정을 반영하는 사회정서학습 설문을 생성하고 관리하세요</p>
              </div>
              
              <div className="flex items-center gap-4">
                <Link href="/dashboard">
                  <Button variant="outline" size="sm">
                    🏠 홈
                  </Button>
                </Link>
                <Button
                  variant={currentView === 'list' ? 'default' : 'outline'}
                  onClick={() => setCurrentView('list')}
                >
                  🧠 설문 목록
                </Button>
                <Button
                  variant={currentView === 'generate' ? 'default' : 'outline'}
                  onClick={() => setCurrentView('generate')}
                >
                  💖 새 설문 생성
                </Button>
              </div>
            </div>
          </div>

          {/* 메인 콘텐츠 */}
          {currentView === 'generate' ? (
            <SurveyGenerator onSurveyGenerated={handleSurveyGenerated} />
          ) : (
            <div className="space-y-6">
              {/* 통계 카드 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">전체 설문</p>
                        <p className="text-2xl font-bold text-teal-600">{surveys.length}</p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-teal-200 rounded-full flex items-center justify-center">
                        <span className="text-xl">🧠</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">활성 설문</p>
                        <p className="text-2xl font-bold text-purple-600">0</p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center">
                        <span className="text-xl">💜</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">응답 수집중</p>
                        <p className="text-2xl font-bold text-pink-600">0</p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-pink-200 rounded-full flex items-center justify-center">
                        <span className="text-xl">🌸</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">완료된 설문</p>
                        <p className="text-2xl font-bold text-gray-500">0</p>
                      </div>
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-xl">📋</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 설문 목록 */}
              <Card>
                <CardHeader>
                  <CardTitle>생성된 설문 목록</CardTitle>
                </CardHeader>
                <CardContent>
                  {surveys.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-24 h-24 bg-gradient-to-br from-teal-100 via-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">🤗</span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        첫 번째 MIRA 설문을 만들어보세요
                      </h3>
                      <p className="text-gray-600 mb-6">
                        AI가 학생의 마음을 이해하는 SEL 설문을 생성해드립니다
                      </p>
                      <Button onClick={() => setCurrentView('generate')} variant="mira">
                        💖 첫 MIRA 설문 생성하기
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {surveys.map((survey: any) => (
                        <div key={survey.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{survey.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{survey.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span>📚 {survey.targetGrade}</span>
                                <span>📊 {survey.questions?.length}문항</span>
                                <span>⭐ {survey.difficultyLevel}</span>
                                <span>📅 {new Date(survey.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handlePreview(survey)}
                              >
                                👀 미리보기
                              </Button>
                              <Button 
                                size="sm"
                                variant="mira"
                                onClick={() => handleDeployToForms(survey)}
                              >
                                📝 Forms 배포
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* 설문 미리보기 모달 */}
        <SurveyPreviewModal
          survey={selectedSurvey}
          isOpen={showPreview}
          onClose={() => {
            setShowPreview(false)
            setSelectedSurvey(null)
          }}
          onDeploy={handleDeployToForms}
        />
      </div>
    </AuthGuard>
  )
}