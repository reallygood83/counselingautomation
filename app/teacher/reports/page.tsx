'use client'

// 동적 페이지로 설정하여 정적 생성 시 Firebase auth 오류 방지
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TeacherNavigation } from '@/components/teacher/TeacherNavigation'
import { SELChart } from '@/components/charts/SELChart'
// Firebase imports를 런타임에 동적으로 로드하여 SSR 오류 방지

interface SurveyResponse {
  id: string
  studentName: string
  selScores: {
    selfAwareness: number
    selfManagement: number
    socialAwareness: number
    relationship: number
    decisionMaking: number
  }
  analyzedAt: string
  overallScore: number
}

interface ClassData {
  totalStudents: number
  respondedStudents: number
  averageScores: {
    selfAwareness: number
    selfManagement: number
    socialAwareness: number
    relationship: number
    decisionMaking: number
  }
  improvementAreas: Array<{
    area: string
    score: number
    trend: 'up' | 'down' | 'stable'
  }>
  topPerformers: Array<{
    name: string
    avgScore: number
  }>
  needsAttention: Array<{
    name: string
    avgScore: number
    reason: string
  }>
}

export default function ReportsPage() {
  const { data: session } = useSession()
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [selectedClass, setSelectedClass] = useState('all')
  const [reportType, setReportType] = useState('overview')
  const [isLoading, setIsLoading] = useState(false)
  const [classData, setClassData] = useState<ClassData | null>(null)
  const [surveys, setSurveys] = useState<any[]>([])
  const [selectedSurvey, setSelectedSurvey] = useState('')

  // 데이터 로드
  useEffect(() => {
    if (session?.user?.email) {
      loadSurveys()
    }
  }, [session])

  useEffect(() => {
    if (selectedSurvey && session?.user?.email) {
      loadSurveyResponses()
    }
  }, [selectedSurvey, selectedPeriod])

  const loadSurveys = async () => {
    try {
      console.log('Loading surveys for user:', session!.user!.email)
      
      // Firebase를 동적으로 import
      const { db } = await import('@/lib/firebase')
      const { collection, query, where, getDocs } = await import('firebase/firestore')
      
      const surveysQuery = query(
        collection(db, 'surveys'),
        where('userEmail', '==', session!.user!.email)
      )
      const surveysSnapshot = await getDocs(surveysQuery)
      const surveysData = surveysSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      console.log('Found surveys:', surveysData.length, surveysData)
      setSurveys(surveysData)
      
      // 첫 번째 설문을 기본 선택
      if (surveysData.length > 0 && !selectedSurvey) {
        setSelectedSurvey(surveysData[0].id)
        console.log('Auto-selected first survey:', surveysData[0].id)
      }
    } catch (error) {
      console.error('설문 목록 로드 실패:', error)
    }
  }

  const loadSurveyResponses = async () => {
    if (!selectedSurvey) return
    
    setIsLoading(true)
    console.log('Loading responses for survey:', selectedSurvey)
    try {
      // Firebase를 동적으로 import
      const { db } = await import('@/lib/firebase')
      const { collection, query, where, getDocs } = await import('firebase/firestore')
      
      // 선택된 설문의 응답 데이터 로드
      const responsesQuery = query(
        collection(db, 'surveyResponses'),
        where('surveyId', '==', selectedSurvey),
        where('processed', '==', true)
      )
      const responsesSnapshot = await getDocs(responsesQuery)
      const responses: SurveyResponse[] = responsesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as SurveyResponse))

      console.log(`Found ${responses.length} processed responses for survey ${selectedSurvey}:`, responses)

      // 통계 계산
      const calculatedData = calculateClassData(responses)
      console.log('Calculated class data:', calculatedData)
      setClassData(calculatedData)
    } catch (error) {
      console.error('응답 데이터 로드 실패:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateClassData = (responses: SurveyResponse[]): ClassData => {
    if (responses.length === 0) {
      return {
        totalStudents: 0,
        respondedStudents: 0,
        averageScores: {
          selfAwareness: 0,
          selfManagement: 0,
          socialAwareness: 0,
          relationship: 0,
          decisionMaking: 0
        },
        improvementAreas: [],
        topPerformers: [],
        needsAttention: []
      }
    }

    // 평균 점수 계산
    const averageScores = {
      selfAwareness: responses.reduce((sum, r) => sum + r.selScores.selfAwareness, 0) / responses.length,
      selfManagement: responses.reduce((sum, r) => sum + r.selScores.selfManagement, 0) / responses.length,
      socialAwareness: responses.reduce((sum, r) => sum + r.selScores.socialAwareness, 0) / responses.length,
      relationship: responses.reduce((sum, r) => sum + r.selScores.relationship, 0) / responses.length,
      decisionMaking: responses.reduce((sum, r) => sum + r.selScores.decisionMaking, 0) / responses.length
    }

    // 상위 성취자 (상위 20%)
    const topPerformers = responses
      .sort((a, b) => b.overallScore - a.overallScore)
      .slice(0, Math.max(1, Math.ceil(responses.length * 0.2)))
      .map(r => ({
        name: r.studentName,
        avgScore: r.overallScore
      }))

    // 관심 필요 학생 (하위 20%)
    const needsAttention = responses
      .sort((a, b) => a.overallScore - b.overallScore)
      .slice(0, Math.max(1, Math.ceil(responses.length * 0.2)))
      .map(r => {
        const lowestArea = Object.entries(r.selScores)
          .sort(([,a], [,b]) => a - b)[0]
        const areaNames: Record<string, string> = {
          selfAwareness: '자기인식',
          selfManagement: '자기관리',
          socialAwareness: '사회적 인식',
          relationship: '관계기술',
          decisionMaking: '의사결정'
        }
        return {
          name: r.studentName,
          avgScore: r.overallScore,
          reason: `${areaNames[lowestArea[0]]} 낮음`
        }
      })

    // 개선 영역
    const improvementAreas = [
      { area: '자기인식', score: averageScores.selfAwareness, trend: 'stable' as const },
      { area: '자기관리', score: averageScores.selfManagement, trend: 'stable' as const },
      { area: '사회적 인식', score: averageScores.socialAwareness, trend: 'stable' as const },
      { area: '관계기술', score: averageScores.relationship, trend: 'stable' as const },
      { area: '의사결정', score: averageScores.decisionMaking, trend: 'stable' as const }
    ].sort((a, b) => a.score - b.score).slice(0, 3)

    return {
      totalStudents: responses.length, // 실제로는 전체 학생 수를 별도로 관리해야 함
      respondedStudents: responses.length,
      averageScores,
      improvementAreas,
      topPerformers,
      needsAttention
    }
  }

  const generateReport = async () => {
    if (!selectedSurvey) {
      alert('분석할 설문을 선택해주세요.')
      return
    }
    
    await loadSurveyResponses()
  }

  return (
    <div className="min-h-screen">
      <TeacherNavigation currentSection="reports" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* 설정 패널 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>📈</span>
                SEL 보고서 생성
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* 설문 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    분석할 설문
                  </label>
                  <select
                    value={selectedSurvey}
                    onChange={(e) => setSelectedSurvey(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="">설문을 선택하세요</option>
                    {surveys.map((survey) => (
                      <option key={survey.id} value={survey.id}>
                        {survey.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 기간 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    분석 기간
                  </label>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="week">최근 1주일</option>
                    <option value="month">최근 1개월</option>
                    <option value="quarter">최근 3개월</option>
                    <option value="year">올해 전체</option>
                  </select>
                </div>

                {/* 보고서 유형 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    보고서 유형
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="overview">종합 개요</option>
                    <option value="individual">개별 학생</option>
                    <option value="comparison">학급 비교</option>
                    <option value="trend">변화 추이</option>
                  </select>
                </div>

                {/* 생성 버튼 */}
                <div className="flex items-end">
                  <Button 
                    onClick={generateReport} 
                    className="w-full"
                    disabled={!selectedSurvey || isLoading}
                  >
                    {isLoading ? '📊 분석 중...' : '📊 보고서 생성'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 보고서 미리보기 */}
          {classData ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 전체 통계 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">📊 전체 현황</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">응답 학생</span>
                      <span className="font-semibold text-teal-600">{classData.respondedStudents}명</span>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-3">SEL 영역별 평균</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>자기인식</span>
                          <span className="font-medium">{classData.averageScores.selfAwareness.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>자기관리</span>
                          <span className="font-medium">{classData.averageScores.selfManagement.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>사회적 인식</span>
                          <span className="font-medium">{classData.averageScores.socialAwareness.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>관계기술</span>
                          <span className="font-medium">{classData.averageScores.relationship.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>의사결정</span>
                          <span className="font-medium">{classData.averageScores.decisionMaking.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SEL 차트 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">🎯 학급 SEL 현황</CardTitle>
                </CardHeader>
                <CardContent>
                  <SELChart
                    data={classData.averageScores}
                    studentName="학급 평균"
                    size="md"
                    showLegend={true}
                  />
                </CardContent>
              </Card>

              {/* 주요 인사이트 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">💡 주요 인사이트</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* 우수 학생 */}
                    {classData.topPerformers.length > 0 && (
                      <div>
                        <h4 className="font-medium text-green-700 mb-2">⭐ 우수 학생</h4>
                        <div className="space-y-1">
                          {classData.topPerformers.map((student, index) => (
                            <div key={index} className="text-sm flex justify-between">
                              <span>{student.name}</span>
                              <span className="text-green-600">{student.avgScore.toFixed(1)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 관심 필요 */}
                    {classData.needsAttention.length > 0 && (
                      <div>
                        <h4 className="font-medium text-amber-700 mb-2">⚠️ 관심 필요</h4>
                        <div className="space-y-2">
                          {classData.needsAttention.map((student, index) => (
                            <div key={index} className="text-sm">
                              <div className="flex justify-between">
                                <span>{student.name}</span>
                                <span className="text-amber-600">{student.avgScore.toFixed(1)}</span>
                              </div>
                              <div className="text-xs text-gray-500">{student.reason}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 개선 영역 */}
                    {classData.improvementAreas.length > 0 && (
                      <div>
                        <h4 className="font-medium text-blue-700 mb-2">📈 개선 영역</h4>
                        <div className="space-y-1">
                          {classData.improvementAreas.map((area, index) => (
                            <div key={index} className="text-sm flex justify-between items-center">
                              <span>{area.area}</span>
                              <div className="flex items-center gap-1">
                                <span className="text-blue-600">{area.score.toFixed(1)}</span>
                                {area.trend === 'up' && <span className="text-green-500">↗</span>}
                                {area.trend === 'down' && <span className="text-red-500">↘</span>}
                                {area.trend === 'stable' && <span className="text-gray-500">→</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="text-gray-500 mb-4">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="text-lg font-medium">보고서 생성 대기 중</h3>
                  <p className="text-sm mt-2">설문을 선택하고 '보고서 생성' 버튼을 클릭하세요</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 액션 버튼 */}
          <Card>
            <CardContent className="py-6">
              <div className="flex flex-wrap gap-4">
                <Button variant="outline" className="flex-1 md:flex-none">
                  📧 학부모 전송
                </Button>
                <Button variant="outline" className="flex-1 md:flex-none">
                  📄 PDF 다운로드
                </Button>
                <Button variant="outline" className="flex-1 md:flex-none">
                  📊 Excel 내보내기
                </Button>
                <Button className="flex-1 md:flex-none">
                  🔄 정기 보고서 설정
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 사용 팁 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>💡</span>
                보고서 활용 팁
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">📈 학급 경영</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• SEL 점수가 낮은 영역을 중심으로 교육 계획 수립</li>
                    <li>• 우수 학생들을 또래 멘토로 활용</li>
                    <li>• 정기적인 모니터링으로 변화 추이 파악</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <h4 className="font-semibold text-green-900 mb-2">👨‍👩‍👧‍👦 학부모 소통</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• 개별 학생 보고서로 상담 자료 활용</li>
                    <li>• 정기 보고서를 통한 투명한 정보 제공</li>
                    <li>• 가정에서의 SEL 교육 가이드 제공</li>
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