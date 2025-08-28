'use client'

// 동적 페이지로 설정하여 정적 생성 시 Firebase auth 오류 방지
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TeacherNavigation } from '@/components/teacher/TeacherNavigation'

interface Student {
  id: string
  name: string
  class: string
  selScores: {
    selfAwareness: number
    selfManagement: number
    socialAwareness: number
    relationship: number
    decisionMaking: number
  }
  overallScore: number
  analyzedAt: string
}

export default function EmotionAnalysisPage() {
  const { data: session } = useSession()
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<string>('')
  const [analysisResult, setAnalysisResult] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [loading, setLoading] = useState(false)

  // 학생 데이터 로드
  useEffect(() => {
    if (session?.user?.email) {
      loadStudents()
    }
  }, [session])

  const loadStudents = async () => {
    try {
      setLoading(true)
      console.log('감정분석용 학생 데이터 로드 중...')
      
      // Firebase를 동적으로 import
      const { db } = await import('@/lib/firebase')
      const { collection, query, where, getDocs } = await import('firebase/firestore')
      
      // 모든 분석 완료된 응답 조회
      const responsesQuery = query(
        collection(db, 'surveyResponses'),
        where('teacherEmail', '==', session!.user!.email),
        where('processed', '==', true),
        where('analysisStatus', '==', 'completed')
      )
      const responsesSnapshot = await getDocs(responsesQuery)
      
      const studentsData: Student[] = responsesSnapshot.docs.map(doc => {
        const data = doc.data()
        const selScores = data.selScores || {}
        const overallScore = Object.values(selScores).length > 0 
          ? Object.values(selScores).reduce((sum: number, score: any) => sum + score, 0) / Object.values(selScores).length
          : 0

        return {
          id: doc.id,
          name: data.studentName || '이름 없음',
          class: data.className || '반 정보 없음',
          selScores,
          overallScore,
          analyzedAt: data.analyzedAt?.toDate()?.toISOString() || new Date().toISOString()
        }
      })

      console.log(`${studentsData.length}명의 학생 데이터 로드 완료:`, studentsData)
      setStudents(studentsData)
      
      // 첫 번째 학생 자동 선택
      if (studentsData.length > 0) {
        setSelectedStudent(studentsData[0].id)
      }
    } catch (error) {
      console.error('학생 데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyze = async () => {
    if (!selectedStudent) return
    
    setIsAnalyzing(true)
    
    try {
      const student = students.find(s => s.id === selectedStudent)
      if (!student) {
        throw new Error('선택된 학생을 찾을 수 없습니다.')
      }

      console.log('SEL 데이터 기반 감정 분석:', student)
      
      // SEL 점수를 기반으로 감정 상태 분석
      const { selScores } = student
      const avgScore = student.overallScore
      
      let emotionalState = '보통'
      let confidence = 0.8
      let insights: string[] = []
      let recommendations: string[] = []

      // SEL 점수 기반 감정 상태 판단
      if (avgScore >= 4.5) {
        emotionalState = '매우 안정적'
        confidence = 0.95
        insights = [
          '전반적으로 사회정서적 역량이 우수합니다.',
          '자기관리 능력과 대인관계 기술이 뛰어납니다.',
          '긍정적인 정서 상태를 유지하고 있습니다.'
        ]
        recommendations = [
          '현재의 긍정적 상태를 유지하도록 격려',
          '다른 학생들을 도울 수 있는 리더십 기회 제공',
          '더 도전적인 과제를 통한 성장 기회 제공'
        ]
      } else if (avgScore >= 4.0) {
        emotionalState = '안정적'
        confidence = 0.9
        insights = [
          '사회정서적 발달이 양호한 상태입니다.',
          '대부분의 영역에서 적절한 역량을 보입니다.',
          '전반적으로 긍정적인 정서를 유지합니다.'
        ]
        recommendations = [
          '현재 수준을 유지하며 꾸준한 발전 도모',
          '약간 부족한 영역에 대한 보완 활동 제공',
          '자신감 강화를 위한 성취 경험 확대'
        ]
      } else if (avgScore >= 3.0) {
        emotionalState = '보통'
        confidence = 0.8
        insights = [
          '평균적인 사회정서적 발달 수준을 보입니다.',
          '일부 영역에서 개선의 여지가 있습니다.',
          '적절한 지원으로 향상 가능한 상태입니다.'
        ]
        recommendations = [
          '개별 상담을 통한 맞춤형 지원 제공',
          '부족한 영역을 중심으로 한 활동 프로그램 참여',
          '또래와의 협력 활동을 통한 사회성 향상'
        ]
      } else if (avgScore >= 2.0) {
        emotionalState = '주의 필요'
        confidence = 0.85
        insights = [
          '사회정서적 발달에 어려움이 있는 것으로 보입니다.',
          '정서 조절이나 대인관계에서 스트레스를 경험할 수 있습니다.',
          '적극적인 지원과 개입이 필요한 상태입니다.'
        ]
        recommendations = [
          '정기적인 개별 상담을 통한 정서적 지원',
          '사회정서학습 프로그램 집중 참여',
          '학부모와의 협력을 통한 가정 연계 지원'
        ]
      } else {
        emotionalState = '적극적 개입 필요'
        confidence = 0.9
        insights = [
          '사회정서적 발달에 상당한 어려움이 있습니다.',
          '정서 조절, 대인관계, 의사결정 등 다방면에서 지원이 필요합니다.',
          '전문적인 개입과 지속적인 관찰이 중요합니다.'
        ]
        recommendations = [
          '전문 상담사와의 정기적 상담 진행',
          '개별 맞춤형 사회정서학습 계획 수립',
          '학부모, 담임교사, 상담교사 간 협력 체계 구축'
        ]
      }

      // 특정 영역별 세부 분석
      const lowScoreAreas = Object.entries(selScores)
        .filter(([_, score]) => score < 3.0)
        .map(([area, _]) => {
          const areaNames: Record<string, string> = {
            selfAwareness: '자기인식',
            selfManagement: '자기관리',
            socialAwareness: '사회적 인식',
            relationship: '관계기술',
            decisionMaking: '의사결정'
          }
          return areaNames[area] || area
        })

      if (lowScoreAreas.length > 0) {
        insights.push(`특히 ${lowScoreAreas.join(', ')} 영역에서 추가 지원이 필요합니다.`)
      }

      setAnalysisResult({
        student: student.name,
        emotionalState,
        confidence,
        avgScore: avgScore.toFixed(1),
        selScores,
        insights,
        recommendations,
        analyzedAt: new Date().toLocaleString('ko-KR'),
        lowScoreAreas
      })
      
    } catch (error) {
      console.error('감정 분석 오류:', error)
      alert('감정 분석 중 오류가 발생했습니다.')
    } finally {
      setIsAnalyzing(false)
    }
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
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2">학생 데이터 로드 중...</span>
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-4">📊 분석 가능한 학생 데이터가 없습니다.</p>
                  <p className="text-sm">먼저 설문 응답 확인 섹션에서 설문을 수집하고 분석해주세요.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {students.map((student) => (
                    <Button
                      key={student.id}
                      variant={selectedStudent === student.id ? 'default' : 'outline'}
                      onClick={() => setSelectedStudent(student.id)}
                      className="h-24 flex flex-col gap-1"
                    >
                      <div className="font-medium">{student.name}</div>
                      <div className="text-sm text-gray-500">{student.class}</div>
                      <div className="text-xs text-green-600">
                        평균: {student.overallScore.toFixed(1)}점
                      </div>
                    </Button>
                  ))}
                </div>
              )}
              
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