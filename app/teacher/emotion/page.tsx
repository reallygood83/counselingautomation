'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TeacherNavigation } from '@/components/teacher/TeacherNavigation'

export default function EmotionAnalysisPage() {
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const mockStudents = [
    { id: '1', name: '김민수', class: '3학년 2반' },
    { id: '2', name: '이지은', class: '3학년 2반' },
    { id: '3', name: '박준호', class: '3학년 1반' }
  ]

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    
    // Mock analysis delay
    setTimeout(() => {
      setAnalysisResult({
        emotionalState: '약간 불안함',
        confidence: 0.85,
        insights: [
          '최근 학업 스트레스가 증가한 것으로 보입니다.',
          '친구 관계에서 약간의 어려움을 경험하고 있습니다.',
          '자신감 회복을 위한 긍정적 피드백이 필요합니다.'
        ],
        recommendations: [
          '개별 상담을 통한 스트레스 관리 방법 제공',
          '소그룹 활동으로 친구 관계 개선 지원',
          '성공 경험을 늘릴 수 있는 과제 제공'
        ]
      })
      setIsAnalyzing(false)
    }, 2000)
  }

  return (
    <div className="min-h-screen">
      <TeacherNavigation currentSection="emotion-analysis" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* 학생 선택 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>🪞</span>
                감정 분석 대상 선택
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {mockStudents.map((student) => (
                  <Button
                    key={student.id}
                    variant={selectedStudent === student.id ? 'default' : 'outline'}
                    onClick={() => setSelectedStudent(student.id)}
                    className="h-20 flex flex-col gap-1"
                  >
                    <div className="font-medium">{student.name}</div>
                    <div className="text-sm text-gray-500">{student.class}</div>
                  </Button>
                ))}
              </div>
              
              {selectedStudent && (
                <div className="mt-6">
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="w-full"
                    size="lg"
                  >
                    {isAnalyzing ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        AI가 감정을 분석중입니다...
                      </div>
                    ) : (
                      '🔍 감정 상태 분석 시작'
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 분석 결과 */}
          {analysisResult && (
            <div className="space-y-6">
              {/* 감정 상태 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>💭</span>
                    현재 감정 상태
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">😟</div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">
                      {analysisResult.emotionalState}
                    </h3>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                      <span>신뢰도:</span>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-teal-500 h-2 rounded-full"
                          style={{ width: `${analysisResult.confidence * 100}%` }}
                        ></div>
                      </div>
                      <span>{Math.round(analysisResult.confidence * 100)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* AI 인사이트 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span>🧠</span>
                      AI 인사이트
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {analysisResult.insights.map((insight: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-teal-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* 지원 방안 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span>💡</span>
                      추천 지원 방안
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {analysisResult.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* 액션 버튼 */}
              <div className="flex gap-4">
                <Button variant="outline" className="flex-1">
                  📋 상담 기록 저장
                </Button>
                <Button variant="outline" className="flex-1">
                  📧 학부모 알림
                </Button>
                <Button className="flex-1">
                  📈 상세 보고서 생성
                </Button>
              </div>
            </div>
          )}

          {/* 사용법 안내 */}
          {!analysisResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>💡</span>
                  감정 분석 사용법
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <ol className="text-sm text-blue-700 space-y-2">
                    <li>1. 분석할 학생을 선택합니다</li>
                    <li>2. "감정 상태 분석 시작" 버튼을 클릭합니다</li>
                    <li>3. AI가 최근 설문 응답을 분석하여 감정 상태를 파악합니다</li>
                    <li>4. 분석 결과와 함께 맞춤형 지원 방안을 확인할 수 있습니다</li>
                  </ol>
                </div>
                
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <h4 className="font-semibold text-yellow-900 mb-2">⚠️ 주의사항</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• 분석 결과는 참고용으로만 사용해 주세요</li>
                    <li>• 심각한 우려 사항이 있을 경우 전문 상담사와 상의하세요</li>
                    <li>• 학생의 개인 정보는 안전하게 보호됩니다</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}