'use client'

// 동적 페이지로 설정하여 정적 생성 시 Firebase auth 오류 방지
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TeacherNavigation } from '@/components/teacher/TeacherNavigation'

interface SavedResponse {
  id: string
  surveyId: string
  formId: string
  
  // 새로운 구조 (v2.0)
  studentInfo?: {
    name: string
    class: string
    number: number
  }
  responseData?: {
    questions: Array<{
      questionIndex: number
      questionId: string
      questionTitle: string
      questionType: string
      answer: any
      answerValue: any
    }>
    metadata: {
      totalQuestions: number
      completedQuestions: number
      responseLanguage: string
      submissionMethod: string
    }
  }
  dataVersion?: string
  dataStructure?: string
  batchInfo?: {
    batchIndex: number
    totalBatches: number
    processedAt: string
  }
  
  // 기존 구조 (호환성 유지)
  studentName?: string
  className?: string
  studentNumber?: number
  answers?: Record<string, any>
  originalAnswers?: Record<string, any>
  
  // 공통 필드
  selScores: {
    selfAwareness: number
    selfManagement: number
    socialAwareness: number
    relationship: number
    decisionMaking: number
  } | null
  processed: boolean
  analysisStatus: string
  savedAt: any
  analyzedAt: any
}

export default function SavedResponsesPage() {
  const { data: session } = useSession()
  const [responses, setResponses] = useState<SavedResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedResponse, setSelectedResponse] = useState<SavedResponse | null>(null)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const [reportData, setReportData] = useState<{html: string, studentName: string} | null>(null)

  // 저장된 응답 데이터 로드
  useEffect(() => {
    if (session?.user?.email) {
      loadSavedResponses()
    }
  }, [session])

  const loadSavedResponses = async () => {
    try {
      setLoading(true)
      console.log('저장된 응답 데이터 로드 중...')
      
      // Firebase를 동적으로 import
      const { db } = await import('@/lib/firebase')
      const { collection, query, where, orderBy, getDocs } = await import('firebase/firestore')
      
      // 교사별 응답 조회 (인덱스 오류 임시 해결 - orderBy 제거)
      const responsesQuery = query(
        collection(db, 'surveyResponses'),
        where('teacherEmail', '==', session!.user!.email)
      )
      const responsesSnapshot = await getDocs(responsesQuery)
      
      const responsesData: SavedResponse[] = responsesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SavedResponse[]

      // 클라이언트 사이드에서 날짜순 정렬 (최신순)
      responsesData.sort((a, b) => {
        const aDate = a.savedAt?.toDate?.() || new Date(0)
        const bDate = b.savedAt?.toDate?.() || new Date(0)
        return bDate.getTime() - aDate.getTime()
      })

      console.log(`${responsesData.length}개의 저장된 응답 로드 완료`)
      setResponses(responsesData)
      
    } catch (error) {
      console.error('응답 데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 학생 정보 추출 함수 (새/기존 구조 호환)
  const getStudentInfo = (response: SavedResponse) => ({
    name: response.studentInfo?.name || response.studentName || '이름 없음',
    class: response.studentInfo?.class || response.className || '반 정보 없음',
    number: response.studentInfo?.number || response.studentNumber || 0
  })

  // 응답 데이터 추출 함수 (새/기존 구조 호환)
  const getResponseAnswers = (response: SavedResponse) => {
    // 새로운 JSON 구조 우선 사용
    if (response.responseData?.questions) {
      const answers: Record<string, any> = {}
      response.responseData.questions.forEach((q, index) => {
        answers[q.questionId || `question_${index}`] = {
          questionTitle: q.questionTitle,
          questionType: q.questionType,
          answer: q.answer || q.answerValue
        }
      })
      return answers
    }
    
    // 기존 구조 fallback
    return response.originalAnswers || response.answers || {}
  }

  // 필터링된 응답 목록
  const filteredResponses = responses.filter(response => {
    const studentInfo = getStudentInfo(response)
    const matchesSearch = studentInfo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         studentInfo.class.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'analyzed' && response.analysisStatus === 'completed') ||
                         (filterStatus === 'pending' && response.analysisStatus === 'pending')
    
    return matchesSearch && matchesFilter
  })

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '날짜 없음'
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
      return date.toLocaleString('ko-KR')
    } catch {
      return '날짜 파싱 오류'
    }
  }

  const calculateOverallScore = (selScores: SavedResponse['selScores']) => {
    if (!selScores) return 0
    const scores = Object.values(selScores).filter(score => score != null && !isNaN(score))
    if (scores.length === 0) return 0
    return scores.reduce((sum, score) => sum + score, 0) / scores.length
  }

  const getAnalysisStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">✅ 분석완료</span>
      case 'pending':
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">⏳ 대기중</span>
      default:
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">❓ 알수없음</span>
    }
  }

  // 응답 삭제 함수
  const deleteResponse = async (responseId: string, studentName: string) => {
    if (!confirm(`${studentName} 학생의 응답을 정말 삭제하시겠습니까?`)) {
      return
    }

    try {
      setProcessingIds(prev => new Set(prev).add(responseId))
      
      // 응답에서 surveyId 찾기
      const targetResponse = responses.find(r => r.id === responseId)
      const surveyId = targetResponse?.surveyId || 'temp'
      
      const response = await fetch(`/api/surveys/${surveyId}/responses/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseId })
      })

      const result = await response.json()

      if (result.success) {
        alert(`${studentName} 학생의 응답이 삭제되었습니다.`)
        await loadSavedResponses() // 목록 새로고침
      } else {
        throw new Error(result.error || '삭제 실패')
      }
    } catch (error) {
      console.error('응답 삭제 오류:', error)
      alert('응답 삭제 중 오류가 발생했습니다.')
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(responseId)
        return newSet
      })
    }
  }

  // 개별 응답 분석 함수
  const analyzeResponse = async (responseId: string, studentName: string) => {
    if (!confirm(`${studentName} 학생의 응답을 분석하시겠습니까?`)) {
      return
    }

    try {
      setProcessingIds(prev => new Set(prev).add(responseId))
      
      // 응답에서 surveyId 찾기
      const targetResponse = responses.find(r => r.id === responseId)
      const surveyId = targetResponse?.surveyId || 'temp'
      
      const response = await fetch(`/api/surveys/${surveyId}/responses/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseId })
      })

      const result = await response.json()

      if (result.success) {
        const totalScore = result.analysis?.summary?.totalScore || 0
        alert(`${studentName} 학생의 응답 분석이 완료되었습니다.\n총점: ${totalScore.toFixed(1)}/5.0`)
        await loadSavedResponses() // 목록 새로고침
      } else {
        throw new Error(result.error || '분석 실패')
      }
    } catch (error) {
      console.error('응답 분석 오류:', error)
      alert('응답 분석 중 오류가 발생했습니다: ' + (error as Error).message)
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(responseId)
        return newSet
      })
    }
  }

  // 상담 리포트 생성 함수
  const generateReport = async (responseId: string, studentName: string) => {
    try {
      setProcessingIds(prev => new Set(prev).add(responseId))
      
      // 응답에서 surveyId 찾기
      const targetResponse = responses.find(r => r.id === responseId)
      const surveyId = targetResponse?.surveyId || 'temp'
      
      const response = await fetch(`/api/surveys/${surveyId}/responses/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseId })
      })

      const result = await response.json()

      if (result.success) {
        setReportData({
          html: result.report.htmlContent,
          studentName: result.report.studentName
        })
      } else {
        throw new Error(result.error || '리포트 생성 실패')
      }
    } catch (error) {
      console.error('리포트 생성 오류:', error)
      alert('리포트 생성 중 오류가 발생했습니다: ' + (error as Error).message)
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(responseId)
        return newSet
      })
    }
  }

  return (
    <div className="min-h-screen">
      <TeacherNavigation currentSection="saved-responses" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">💾 저장된 응답 관리</h1>
            <p className="text-gray-600">Firebase에 저장된 모든 설문 응답을 확인하고 관리할 수 있습니다</p>
          </div>

          {/* 검색 및 필터 */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🔍 학생명/반 검색
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="학생명 또는 반 이름으로 검색"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📊 분석 상태 필터
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="all">전체 보기</option>
                    <option value="completed">분석 완료</option>
                    <option value="pending">분석 대기</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <Button
                    onClick={loadSavedResponses}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-teal-500 to-purple-600 hover:from-teal-600 hover:to-purple-700"
                  >
                    {loading ? '🔄 로딩중...' : '🔄 새로고침'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 통계 요약 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-teal-600">{responses.length}</div>
                <div className="text-sm text-gray-600">총 응답 수</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {responses.filter(r => r.analysisStatus === 'completed').length}
                </div>
                <div className="text-sm text-gray-600">분석 완료</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {responses.filter(r => r.analysisStatus === 'pending').length}
                </div>
                <div className="text-sm text-gray-600">분석 대기</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {filteredResponses.length}
                </div>
                <div className="text-sm text-gray-600">검색 결과</div>
              </CardContent>
            </Card>
          </div>

          {/* 응답 목록 */}
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">저장된 응답을 불러오는 중...</p>
              </CardContent>
            </Card>
          ) : filteredResponses.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {responses.length === 0 ? '저장된 응답이 없습니다' : '검색 결과가 없습니다'}
                </h3>
                <p className="text-gray-600">
                  {responses.length === 0 
                    ? '설문 응답 확인 페이지에서 "자동 수집+분석"을 먼저 실행해주세요'
                    : '다른 검색어나 필터를 시도해보세요'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredResponses.map((response) => {
                const studentInfo = getStudentInfo(response)
                return (
                  <Card key={response.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between text-lg">
                        <span className="font-bold text-teal-700">👤 {studentInfo.name}</span>
                        {getAnalysisStatusBadge(response.analysisStatus)}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      
                      {/* 학생 정보 */}
                      <div className="text-sm text-gray-600">
                        <div>🏫 {studentInfo.class} | 📋 {studentInfo.number}번</div>
                        {response.dataVersion && (
                          <div className="text-xs text-purple-600 mt-1">
                            📊 데이터 v{response.dataVersion} ({response.dataStructure})
                          </div>
                        )}
                        {response.batchInfo && (
                          <div className="text-xs text-blue-600 mt-1">
                            🔄 배치 {response.batchInfo.batchIndex}/{response.batchInfo.totalBatches}
                          </div>
                        )}
                      </div>
                    
                    {/* SEL 점수 (있는 경우) */}
                    {response.selScores && (
                      <div className="bg-gradient-to-r from-teal-50 to-purple-50 p-3 rounded-lg">
                        <div className="text-sm font-semibold text-teal-700 mb-2">📊 SEL 종합 점수</div>
                        <div className="text-lg font-bold text-purple-600">
                          {(calculateOverallScore(response.selScores) || 0).toFixed(1)} / 5.0
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-xs text-gray-600 mt-2">
                          <div>자기인식: {(response.selScores.selfAwareness || 0).toFixed(1)}</div>
                          <div>자기관리: {(response.selScores.selfManagement || 0).toFixed(1)}</div>
                          <div>사회인식: {(response.selScores.socialAwareness || 0).toFixed(1)}</div>
                          <div>관계기술: {(response.selScores.relationship || 0).toFixed(1)}</div>
                          <div className="col-span-2">의사결정: {(response.selScores.decisionMaking || 0).toFixed(1)}</div>
                        </div>
                      </div>
                    )}
                    
                    {/* 저장/분석 일시 */}
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>💾 저장: {formatDate(response.savedAt)}</div>
                      {response.analyzedAt && (
                        <div>🔍 분석: {formatDate(response.analyzedAt)}</div>
                      )}
                    </div>
                    
                    {/* 액션 버튼 */}
                    <div className="pt-3 border-t space-y-2">
                      <Button
                        onClick={() => setSelectedResponse(response)}
                        variant="outline"
                        size="sm"
                        className="w-full text-xs bg-gradient-to-r from-teal-50 to-purple-50 border-teal-200 text-teal-700 hover:bg-gradient-to-r hover:from-teal-100 hover:to-purple-100"
                        disabled={processingIds.has(response.id)}
                      >
                        📋 상세 응답 보기
                      </Button>
                      
                      <div className="grid grid-cols-3 gap-2">
                        {/* 분석 버튼 */}
                        <Button
                          onClick={() => analyzeResponse(response.id, studentInfo.name)}
                          variant="outline" 
                          size="sm"
                          className="text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                          disabled={processingIds.has(response.id)}
                        >
                          {processingIds.has(response.id) ? '🔄' : '🔍'} 분석
                        </Button>
                        
                        {/* 리포트 버튼 */}
                        <Button
                          onClick={() => generateReport(response.id, studentInfo.name)}
                          variant="outline"
                          size="sm"
                          className="text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                          disabled={processingIds.has(response.id) || response.analysisStatus !== 'completed'}
                        >
                          {processingIds.has(response.id) ? '🔄' : '📊'} 리포트
                        </Button>
                        
                        {/* 삭제 버튼 */}
                        <Button
                          onClick={() => deleteResponse(response.id, studentInfo.name)}
                          variant="outline"
                          size="sm"
                          className="text-xs bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                          disabled={processingIds.has(response.id)}
                        >
                          {processingIds.has(response.id) ? '🔄' : '🗑️'} 삭제
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                )
              })}
            </div>
          )}

          {/* 상세 응답 모달 */}
          {selectedResponse && (() => {
            const studentInfo = getStudentInfo(selectedResponse)
            const answers = getResponseAnswers(selectedResponse)
            
            return (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-teal-700">
                        👤 {studentInfo.name} 상세 응답
                      </h2>
                      <Button
                        onClick={() => setSelectedResponse(null)}
                        variant="outline"
                        size="sm"
                      >
                        ✕ 닫기
                      </Button>
                    </div>
                    
                    {/* 응답 상세 내용 */}
                    <div className="space-y-4">
                      
                      {/* 메타데이터 정보 (새로운 구조인 경우) */}
                      {selectedResponse.responseData?.metadata && (
                        <Card>
                          <CardContent className="p-4">
                            <h3 className="font-semibold mb-3">📊 응답 메타데이터</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">총 질문 수:</span> 
                                <span className="ml-2 font-semibold">{selectedResponse.responseData.metadata.totalQuestions}개</span>
                              </div>
                              <div>
                                <span className="text-gray-600">완료된 질문:</span>
                                <span className="ml-2 font-semibold">{selectedResponse.responseData.metadata.completedQuestions}개</span>
                              </div>
                              <div>
                                <span className="text-gray-600">응답 언어:</span>
                                <span className="ml-2 font-semibold">{selectedResponse.responseData.metadata.responseLanguage}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">수집 방식:</span>
                                <span className="ml-2 font-semibold">{selectedResponse.responseData.metadata.submissionMethod}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      
                      <Card>
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-3">📝 설문 응답 내역</h3>
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {Object.entries(answers).map(([questionId, answerData], index) => (
                              <div key={questionId} className="bg-gray-50 p-3 rounded">
                                <div className="text-sm font-medium text-gray-700 mb-1">
                                  질문 {index + 1}: {(answerData as any)?.questionTitle || '질문 제목 없음'}
                                </div>
                                <div className="text-sm text-gray-900">
                                  답변: {(answerData as any)?.answer || '답변 없음'}
                                </div>
                                {(answerData as any)?.questionType && (
                                  <div className="text-xs text-purple-600 mt-1">
                                    유형: {(answerData as any).questionType}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* 배치 정보 (새로운 구조인 경우) */}
                      {selectedResponse.batchInfo && (
                        <Card>
                          <CardContent className="p-4">
                            <h3 className="font-semibold mb-3">🔄 배치 처리 정보</h3>
                            <div className="text-sm text-gray-600">
                              <div>배치 번호: {selectedResponse.batchInfo.batchIndex}/{selectedResponse.batchInfo.totalBatches}</div>
                              <div>처리 시간: {selectedResponse.batchInfo.processedAt}</div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                      
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* 상담 리포트 모달 */}
          {reportData && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-6 border-b">
                  <h2 className="text-xl font-bold text-teal-700">
                    📊 {reportData.studentName} 학생 SEL 상담 리포트
                  </h2>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        const blob = new Blob([reportData.html], { type: 'text/html' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a')
                        a.href = url
                        a.download = `${reportData.studentName}_SEL상담리포트_${new Date().toISOString().split('T')[0]}.html`
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                        URL.revokeObjectURL(url)
                      }}
                      variant="outline"
                      size="sm"
                      className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                    >
                      💾 다운로드
                    </Button>
                    <Button
                      onClick={() => {
                        const printWindow = window.open('', '_blank')
                        if (printWindow) {
                          printWindow.document.write(reportData.html)
                          printWindow.document.close()
                          printWindow.focus()
                          printWindow.print()
                        }
                      }}
                      variant="outline"
                      size="sm"
                      className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                    >
                      🖨️ 인쇄
                    </Button>
                    <Button
                      onClick={() => setReportData(null)}
                      variant="outline"
                      size="sm"
                    >
                      ✕ 닫기
                    </Button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  <iframe
                    srcDoc={reportData.html}
                    className="w-full h-full min-h-[600px] border-0"
                    title="SEL 상담 리포트"
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}