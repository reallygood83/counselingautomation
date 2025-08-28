'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface Response {
  responseId: string
  studentId?: string
  studentName: string
  className: string
  studentNumber: number
  submittedAt: string
  answers: Record<string, any>
  selScores?: any
  processed: boolean
}

interface UnmatchedResponse {
  responseId: string
  studentInfo: {
    studentName: string
    className: string
    studentNumber: number
  }
  submittedAt: string
  reason: string
}

interface ResponseViewerProps {
  formId: string
  surveyId?: string // 선택적으로 변경
  formTitle?: string
}

export function ResponseViewer({ formId, surveyId, formTitle }: ResponseViewerProps) {
  const [responses, setResponses] = useState<Response[]>([])
  const [unmatchedResponses, setUnmatchedResponses] = useState<UnmatchedResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [totalResponses, setTotalResponses] = useState(0)
  const [actualSurveyId, setActualSurveyId] = useState<string | null>(null)

  // formId로 surveyId 찾기
  const findSurveyIdByFormId = async (formId: string): Promise<string | null> => {
    try {
      const response = await fetch(`/api/surveys/list`)
      const data = await response.json()
      
      if (response.ok && data.surveys) {
        const survey = data.surveys.find((s: any) => s.formId === formId)
        return survey ? survey.id : null
      }
    } catch (err) {
      console.error('surveyId 찾기 실패:', err)
    }
    return null
  }

  // 응답 데이터 로드
  const loadResponses = async () => {
    if (!formId) return
    
    console.log('ResponseViewer에서 사용할 formId:', formId)
    
    if (formId.length < 10) {
      setError('유효하지 않은 Google Forms ID입니다. ID는 최소 10자 이상이어야 합니다.')
      return
    }
    
    try {
      setLoading(true)
      setError('')

      console.log('Forms API 호출 URL:', `/api/forms/responses?formId=${formId}`)
      const response = await fetch(`/api/forms/responses?formId=${formId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '응답 로드 실패')
      }

      setResponses(data.responses || [])
      setUnmatchedResponses(data.unmatchedData || [])
      setTotalResponses(data.totalResponses || 0)

    } catch (err) {
      setError(err instanceof Error ? err.message : '응답 로드 중 오류 발생')
    } finally {
      setLoading(false)
    }
  }

  // Firebase에 응답 저장
  const saveResponses = async () => {
    if (responses.length === 0) {
      setError('저장할 응답이 없습니다.')
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch('/api/forms/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses,
          formId,
          surveyId: surveyId || actualSurveyId || formId // surveyId 우선, 없으면 actualSurveyId, 최후에 formId
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || '응답 저장 실패')
      }

      alert(`${data.saved}개의 응답이 Firebase에 저장되었습니다.`)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '응답 저장 중 오류 발생')
    } finally {
      setLoading(false)
    }
  }

  // 자동 수집 + SEL 분석
  const autoCollectAndAnalyze = async () => {
    try {
      setLoading(true)
      setError('')

      // surveyId 확인 및 가져오기
      let targetSurveyId = surveyId || actualSurveyId
      
      if (!targetSurveyId) {
        console.log('surveyId를 찾는 중...')
        targetSurveyId = await findSurveyIdByFormId(formId)
        if (targetSurveyId) {
          setActualSurveyId(targetSurveyId)
        }
      }

      if (!targetSurveyId) {
        throw new Error('해당 formId에 대응하는 설문을 찾을 수 없습니다. 먼저 설문을 생성하고 배포해주세요.')
      }

      console.log('사용할 surveyId:', targetSurveyId)

      // 실제 surveyId를 사용하여 자동 수집 API 호출
      const response = await fetch(`/api/surveys/${targetSurveyId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || '자동 수집 및 분석 실패')
      }

      alert(`🎉 자동 처리 완료!\n\n📊 수집: ${data.stats.savedResponses}개\n🧠 분석: ${data.stats.analyzedResponses}개\n❌ 매칭실패: ${data.stats.unmatchedResponses}개`)
      
      // 응답 데이터 새로고침
      await loadResponses()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : '자동 처리 중 오류 발생')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">설문 응답 확인</h2>
          {formTitle && (
            <p className="text-gray-600 mt-1">📋 {formTitle}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={loadResponses}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? '로딩 중...' : '📥 응답 불러오기'}
          </Button>
          {responses.length > 0 && (
            <>
              <Button
                onClick={saveResponses}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                💾 Firebase 저장
              </Button>
              <Button
                onClick={autoCollectAndAnalyze}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                🤖 자동 수집+분석
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700">
          {error}
        </div>
      )}

      {/* 응답 통계 */}
      {totalResponses > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <h3 className="font-semibold text-gray-700">전체 응답</h3>
            <p className="text-2xl font-bold text-blue-600">{totalResponses}개</p>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold text-gray-700">매칭된 응답</h3>
            <p className="text-2xl font-bold text-green-600">{responses.length}개</p>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold text-gray-700">매칭 실패</h3>
            <p className="text-2xl font-bold text-red-600">{unmatchedResponses.length}개</p>
          </Card>
        </div>
      )}

      {/* 매칭된 응답 목록 */}
      {responses.length > 0 && (
        <Card className="overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b">
            <h3 className="text-lg font-semibold text-gray-900">✅ 매칭된 응답 목록</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    학생 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    제출 시간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    응답 수
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {responses.map((response) => (
                  <tr key={response.responseId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {response.studentName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {response.className} {response.studentNumber}번
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(response.submittedAt).toLocaleString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Object.keys(response.answers).length}개
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        response.processed 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {response.processed ? '처리 완료' : '처리 대기'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* 매칭 실패 응답 목록 */}
      {unmatchedResponses.length > 0 && (
        <Card className="overflow-hidden">
          <div className="bg-red-50 px-6 py-3 border-b">
            <h3 className="text-lg font-semibold text-red-900">❌ 매칭 실패 응답 목록</h3>
            <p className="text-sm text-red-600 mt-1">등록된 학생 정보와 일치하지 않는 응답들입니다.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    입력된 학생 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    제출 시간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    실패 이유
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {unmatchedResponses.map((response) => (
                  <tr key={response.responseId} className="hover:bg-red-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {response.studentInfo.studentName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {response.studentInfo.className} {response.studentInfo.studentNumber}번
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(response.submittedAt).toLocaleString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 text-sm text-red-600">
                      {response.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-yellow-50 px-6 py-3 border-t">
            <p className="text-sm text-yellow-800">
              💡 <strong>해결 방법:</strong> 학생 관리 메뉴에서 해당 학생들을 등록하거나, 
              입력된 정보와 일치하도록 학생 정보를 수정해주세요.
            </p>
          </div>
        </Card>
      )}

      {/* 응답이 없을 때 */}
      {!loading && totalResponses === 0 && (
        <Card className="p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">응답이 없습니다</h3>
          <p className="text-gray-500 mb-4">
            아직 학생들이 설문에 응답하지 않았거나,<br/>
            응답을 불러오지 않았습니다.
          </p>
          <Button onClick={loadResponses} disabled={loading}>
            📥 응답 다시 확인하기
          </Button>
        </Card>
      )}
    </div>
  )
}