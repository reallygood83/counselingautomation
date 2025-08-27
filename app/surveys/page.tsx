'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { AuthGuard } from '@/components/auth/AuthButton'
import { SurveyGenerator } from '@/components/surveys/SurveyGenerator'

export default function SurveysPage() {
  const [currentView, setCurrentView] = useState<'list' | 'generate'>('list')
  const [surveys, setSurveys] = useState<any[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)

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

  if (!isInitialized) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-white">⚙️</span>
              </div>
              <CardTitle>초기 설정이 필요합니다</CardTitle>
              <p className="text-gray-600 text-sm">
                Google Drive에 상담 데이터 저장 공간을 준비합니다
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">생성될 항목:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>✅ '상담자동화' 폴더</li>
                    <li>✅ '학생 상담 데이터' 스프레드시트</li>
                    <li>✅ 개인 데이터 보안 설정</li>
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
                    '🚀 초기 설정 시작하기'
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
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">SEL 설문 관리</h1>
                <p className="text-gray-600 mt-2">AI 기반 사회정서학습 설문을 생성하고 관리하세요</p>
              </div>
              
              <div className="flex items-center gap-4">
                <Button
                  variant={currentView === 'list' ? 'default' : 'outline'}
                  onClick={() => setCurrentView('list')}
                >
                  📋 설문 목록
                </Button>
                <Button
                  variant={currentView === 'generate' ? 'default' : 'outline'}
                  onClick={() => setCurrentView('generate')}
                >
                  ➕ 새 설문 생성
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
                        <p className="text-2xl font-bold text-gray-900">{surveys.length}</p>
                      </div>
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xl">📝</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">활성 설문</p>
                        <p className="text-2xl font-bold text-green-600">0</p>
                      </div>
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-xl">✅</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">응답 수집중</p>
                        <p className="text-2xl font-bold text-orange-600">0</p>
                      </div>
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-xl">📊</span>
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
                      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">📝</span>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        아직 생성된 설문이 없습니다
                      </h3>
                      <p className="text-gray-600 mb-6">
                        AI 설문 생성기로 첫 번째 SEL 설문을 만들어보세요
                      </p>
                      <Button onClick={() => setCurrentView('generate')}>
                        🤖 첫 설문 생성하기
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
                              <Button variant="outline" size="sm">
                                미리보기
                              </Button>
                              <Button size="sm">
                                Forms 배포
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
      </div>
    </AuthGuard>
  )
}