'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TeacherNavigation } from '@/components/teacher/TeacherNavigation'
import { SELChart } from '@/components/charts/SELChart'

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [selectedClass, setSelectedClass] = useState('all')
  const [reportType, setReportType] = useState('overview')

  const mockClassData = {
    totalStudents: 28,
    respondedStudents: 25,
    averageScores: {
      selfAwareness: 3.8,
      selfManagement: 3.5,
      socialAwareness: 4.1,
      relationship: 3.7,
      decisionMaking: 3.6
    },
    improvementAreas: [
      { area: '자기관리', score: 3.5, trend: 'down' },
      { area: '관계기술', score: 3.7, trend: 'up' },
      { area: '의사결정', score: 3.6, trend: 'stable' }
    ],
    topPerformers: [
      { name: '김민수', avgScore: 4.3 },
      { name: '박준호', avgScore: 4.1 },
      { name: '최서연', avgScore: 4.0 }
    ],
    needsAttention: [
      { name: '이지은', avgScore: 2.8, reason: '사회적 인식 낮음' },
      { name: '정수민', avgScore: 2.9, reason: '자기관리 어려움' }
    ]
  }

  const generateReport = async () => {
    // Mock report generation
    console.log('Generating report with:', { selectedPeriod, selectedClass, reportType })
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

                {/* 학급 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    대상 학급
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="all">전체 학급</option>
                    <option value="3-1">3학년 1반</option>
                    <option value="3-2">3학년 2반</option>
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
                  <Button onClick={generateReport} className="w-full">
                    📊 보고서 생성
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 보고서 미리보기 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 전체 통계 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📊 전체 현황</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">전체 학생</span>
                    <span className="font-semibold">{mockClassData.totalStudents}명</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">응답 학생</span>
                    <span className="font-semibold text-teal-600">{mockClassData.respondedStudents}명</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">응답률</span>
                    <span className="font-semibold">
                      {Math.round((mockClassData.respondedStudents / mockClassData.totalStudents) * 100)}%
                    </span>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3">SEL 영역별 평균</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>자기인식</span>
                        <span className="font-medium">{mockClassData.averageScores.selfAwareness}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>자기관리</span>
                        <span className="font-medium">{mockClassData.averageScores.selfManagement}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>사회적 인식</span>
                        <span className="font-medium">{mockClassData.averageScores.socialAwareness}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>관계기술</span>
                        <span className="font-medium">{mockClassData.averageScores.relationship}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>의사결정</span>
                        <span className="font-medium">{mockClassData.averageScores.decisionMaking}</span>
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
                  data={mockClassData.averageScores}
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
                  <div>
                    <h4 className="font-medium text-green-700 mb-2">⭐ 우수 학생</h4>
                    <div className="space-y-1">
                      {mockClassData.topPerformers.map((student, index) => (
                        <div key={index} className="text-sm flex justify-between">
                          <span>{student.name}</span>
                          <span className="text-green-600">{student.avgScore}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 관심 필요 */}
                  <div>
                    <h4 className="font-medium text-amber-700 mb-2">⚠️ 관심 필요</h4>
                    <div className="space-y-2">
                      {mockClassData.needsAttention.map((student, index) => (
                        <div key={index} className="text-sm">
                          <div className="flex justify-between">
                            <span>{student.name}</span>
                            <span className="text-amber-600">{student.avgScore}</span>
                          </div>
                          <div className="text-xs text-gray-500">{student.reason}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 개선 영역 */}
                  <div>
                    <h4 className="font-medium text-blue-700 mb-2">📈 개선 영역</h4>
                    <div className="space-y-1">
                      {mockClassData.improvementAreas.map((area, index) => (
                        <div key={index} className="text-sm flex justify-between items-center">
                          <span>{area.area}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-blue-600">{area.score}</span>
                            {area.trend === 'up' && <span className="text-green-500">↗</span>}
                            {area.trend === 'down' && <span className="text-red-500">↘</span>}
                            {area.trend === 'stable' && <span className="text-gray-500">→</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

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