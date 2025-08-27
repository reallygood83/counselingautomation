'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TeacherNavigation } from '@/components/teacher/TeacherNavigation'

export default function GoogleIntegrationPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [driveInfo, setDriveInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      // Mock connection status check
      setIsConnected(false)
    } catch (error) {
      console.error('Connection check failed:', error)
    }
  }

  const connectToGoogle = async () => {
    setIsLoading(true)
    try {
      // Mock Google OAuth connection
      setTimeout(() => {
        setIsConnected(true)
        setUserInfo({
          email: 'teacher@school.edu',
          name: '김선생님',
          picture: '/api/placeholder/40/40'
        })
        setDriveInfo({
          totalSpace: '15 GB',
          usedSpace: '3.2 GB',
          folderCreated: true,
          sheetsCreated: true
        })
        setIsLoading(false)
      }, 2000)
    } catch (error) {
      console.error('Google connection failed:', error)
      setIsLoading(false)
    }
  }

  const disconnectFromGoogle = async () => {
    setIsConnected(false)
    setUserInfo(null)
    setDriveInfo(null)
  }

  const syncData = async () => {
    console.log('Syncing data with Google Drive...')
  }

  const createBackup = async () => {
    console.log('Creating backup...')
  }

  return (
    <div className="min-h-screen">
      <TeacherNavigation currentSection="google-integration" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 연결 상태 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🔗</span>
                Google 서비스 연동 상태
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isConnected ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🔒</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    Google 서비스에 연결되지 않음
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Google Drive와 연동하여 상담 데이터를 안전하게 저장하고 관리하세요
                  </p>
                  <Button
                    onClick={connectToGoogle}
                    disabled={isLoading}
                    size="lg"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        연결중...
                      </div>
                    ) : (
                      '🔗 Google 계정 연결'
                    )}
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">{userInfo?.name?.charAt(0)}</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">{userInfo?.name}</h3>
                      <p className="text-sm text-gray-600">{userInfo?.email}</p>
                      <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium mt-1">
                        ✅ 연결됨
                      </span>
                    </div>
                    <div className="ml-auto">
                      <Button variant="outline" onClick={disconnectFromGoogle} size="sm">
                        연결 해제
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Google Drive 정보 */}
          {isConnected && driveInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>💾</span>
                  Google Drive 상태
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">📁</span>
                    </div>
                    <h4 className="font-medium">MIRA 폴더</h4>
                    <p className="text-sm text-gray-600">
                      {driveInfo.folderCreated ? '생성 완료' : '생성 필요'}
                    </p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                      driveInfo.folderCreated 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {driveInfo.folderCreated ? '✅ 완료' : '⚠️ 대기'}
                    </span>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">📊</span>
                    </div>
                    <h4 className="font-medium">데이터 시트</h4>
                    <p className="text-sm text-gray-600">
                      {driveInfo.sheetsCreated ? '생성 완료' : '생성 필요'}
                    </p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                      driveInfo.sheetsCreated 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {driveInfo.sheetsCreated ? '✅ 완료' : '⚠️ 대기'}
                    </span>
                  </div>

                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">💿</span>
                    </div>
                    <h4 className="font-medium">저장 공간</h4>
                    <p className="text-sm text-gray-600">
                      {driveInfo.usedSpace} / {driveInfo.totalSpace}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: '21%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 데이터 관리 */}
          {isConnected && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>⚙️</span>
                  데이터 관리
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" onClick={syncData} className="h-20 flex flex-col gap-1">
                    <span className="text-2xl">🔄</span>
                    <span>데이터 동기화</span>
                    <span className="text-xs text-gray-500">최근: 2025년 1월 25일</span>
                  </Button>
                  
                  <Button variant="outline" onClick={createBackup} className="h-20 flex flex-col gap-1">
                    <span className="text-2xl">💾</span>
                    <span>백업 생성</span>
                    <span className="text-xs text-gray-500">자동 백업: 매일 오후 6시</span>
                  </Button>
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="font-semibold text-blue-900 mb-2">🔒 개인정보 보호</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• 모든 데이터는 개인 Google Drive에만 저장됩니다</li>
                    <li>• 암호화된 상태로 전송 및 저장됩니다</li>
                    <li>• 제3자와 데이터를 공유하지 않습니다</li>
                    <li>• 언제든지 연결을 해제할 수 있습니다</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 연동 기능 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🌟</span>
                Google 연동 기능
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">📊 Google Sheets 연동</h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-teal-500">•</span>
                      설문 응답 자동 저장 및 분석
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-teal-500">•</span>
                      SEL 점수 추이 그래프 생성
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-teal-500">•</span>
                      학급별 통계 자동 계산
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-teal-500">•</span>
                      학부모 공유용 보고서 생성
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium mb-3">📁 Google Drive 백업</h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500">•</span>
                      모든 상담 데이터 자동 백업
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500">•</span>
                      버전 관리로 데이터 복구 가능
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500">•</span>
                      폴더 구조 자동 생성 및 관리
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-purple-500">•</span>
                      개인정보 보호를 위한 암호화
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 문제 해결 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>❓</span>
                문제 해결
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <h4 className="font-semibold text-yellow-900 mb-2">⚠️ 연결 문제</h4>
                  <p className="text-sm text-yellow-700 mb-2">
                    Google 계정 연결에 문제가 있나요?
                  </p>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• 브라우저 쿠키 및 캐시를 삭제해 보세요</li>
                    <li>• 팝업 차단이 해제되어 있는지 확인하세요</li>
                    <li>• 개인 계정이 아닌 학교 계정을 사용해 보세요</li>
                  </ul>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <h4 className="font-semibold text-red-900 mb-2">🚨 데이터 복구</h4>
                  <p className="text-sm text-red-700 mb-2">
                    데이터가 손실된 경우 복구 방법:
                  </p>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• Google Drive 휴지통에서 복구</li>
                    <li>• 자동 백업 파일에서 복구</li>
                    <li>• 관리자에게 문의</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}