'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface SurveyConfig {
  targetGrade: string
  studentName?: string
  focusAreas?: string[]
  difficultyLevel: 'basic' | 'standard' | 'advanced'
  includeStudentFields?: boolean
  classNames?: string[]
}

interface SurveyGeneratorProps {
  onSurveyGenerated?: (survey: any) => void
}

export function SurveyGenerator({ onSurveyGenerated }: SurveyGeneratorProps) {
  const [config, setConfig] = useState<SurveyConfig>({
    targetGrade: '',
    studentName: '',
    focusAreas: [],
    difficultyLevel: 'standard',
    includeStudentFields: true,
    classNames: []
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const focusAreaOptions = [
    { value: 'selfAwareness', label: '자기인식' },
    { value: 'selfManagement', label: '자기관리' },
    { value: 'socialAwareness', label: '사회적 인식' },
    { value: 'relationship', label: '관계기술' },
    { value: 'decisionMaking', label: '의사결정' }
  ]

  const gradeOptions = [
    '초등학교 1학년', '초등학교 2학년', '초등학교 3학년', 
    '초등학교 4학년', '초등학교 5학년', '초등학교 6학년',
    '중학교 1학년', '중학교 2학년', '중학교 3학년',
    '고등학교 1학년', '고등학교 2학년', '고등학교 3학년'
  ]

  const handleFocusAreaChange = (area: string, checked: boolean) => {
    if (checked) {
      setConfig(prev => ({
        ...prev,
        focusAreas: [...(prev.focusAreas || []), area]
      }))
    } else {
      setConfig(prev => ({
        ...prev,
        focusAreas: prev.focusAreas?.filter(a => a !== area) || []
      }))
    }
  }

  const generateSurvey = async () => {
    if (!config.targetGrade) {
      setError('대상 학년을 선택해주세요.')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/surveys/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        const serverMsg = (data && (data.error || data.details)) ? `${data.error}${data.details ? `\n세부: ${data.details}` : ''}` : `설문 생성에 실패했습니다. (status: ${response.status})`
        throw new Error(serverMsg)
      }

      if (!data) {
        throw new Error('서버 응답을 파싱할 수 없습니다.')
      }

      // 생성된 설문을 Firestore에 저장
      console.log('Saving survey to Firebase...')
      const saveResponse = await fetch('/api/surveys/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data.survey)
      })

      const saveData = await saveResponse.json().catch(() => null)
      
      if (saveResponse.ok && saveData?.success) {
        console.log('Survey saved successfully with ID:', saveData.id)
        // ID 추가하여 부모 컴포넌트에 전달
        const surveyWithId = {
          ...data.survey,
          id: saveData.id,
          status: 'created',
          createdAt: new Date().toISOString()
        }
        
        if (onSurveyGenerated) {
          onSurveyGenerated(surveyWithId)
        }
      } else {
        console.error('Survey save failed:', saveData?.error)
        // 저장 실패해도 설문은 전달 (메모리에서라도 사용 가능)
        if (onSurveyGenerated) {
          onSurveyGenerated({
            ...data.survey,
            id: 'temp-' + Date.now(),
            status: 'unsaved',
            createdAt: new Date().toISOString()
          })
        }
      }
      
    } catch (error: any) {
      console.error('설문 생성 오류:', error)
      setError(typeof error?.message === 'string' ? error.message : '설문 생성 중 오류가 발생했습니다.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">M</span>
          </div>
          <span className="bg-gradient-to-r from-teal-600 to-purple-600 bg-clip-text text-transparent">
            MIRA 설문 생성기
          </span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          💖 내면과 감정을 반영하는 맞춤형 SEL 설문을 AI가 생성해드립니다
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 대상 학년 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            대상 학년 *
          </label>
          <select 
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            value={config.targetGrade}
            onChange={(e) => setConfig(prev => ({ ...prev, targetGrade: e.target.value }))}
          >
            <option value="">학년을 선택하세요</option>
            {gradeOptions.map(grade => (
              <option key={grade} value={grade}>{grade}</option>
            ))}
          </select>
        </div>

        {/* 학생명 (선택사항) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            학생명 (선택사항)
          </label>
          <input
            type="text"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="개별 학생 설문시 입력"
            value={config.studentName}
            onChange={(e) => setConfig(prev => ({ ...prev, studentName: e.target.value }))}
          />
        </div>

        {/* 중점 영역 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            중점 평가 영역 (전체 선택시 균형있게 생성)
          </label>
          <div className="grid grid-cols-2 gap-3">
            {focusAreaOptions.map(option => (
              <label key={option.value} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={config.focusAreas?.includes(option.value) || false}
                  onChange={(e) => handleFocusAreaChange(option.value, e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 난이도 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            문항 난이도
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'basic', label: '기초', desc: '간단한 표현' },
              { value: 'standard', label: '표준', desc: '일반적 수준' },
              { value: 'advanced', label: '심화', desc: '복잡한 개념' }
            ].map(level => (
              <label key={level.value} className="flex flex-col p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <div className="flex items-center gap-2 mb-1">
                  <input
                    type="radio"
                    name="difficultyLevel"
                    value={level.value}
                    checked={config.difficultyLevel === level.value}
                    onChange={(e) => setConfig(prev => ({ ...prev, difficultyLevel: e.target.value as any }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">{level.label}</span>
                </div>
                <span className="text-xs text-gray-500">{level.desc}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 학생 필드 옵션 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            학생 식별 설정
          </label>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={config.includeStudentFields}
                onChange={(e) => setConfig(prev => ({ ...prev, includeStudentFields: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium">학생 식별 필드 자동 추가</span>
                <p className="text-xs text-gray-500">Forms에 학생명, 학급, 번호 입력 필드가 자동으로 추가됩니다</p>
              </div>
            </label>
            
            {config.includeStudentFields && (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  학급 목록 (선택사항)
                </label>
                <textarea
                  className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  placeholder="3-1, 3-2, 4-1, 4-2 (쉼표로 구분)"
                  value={config.classNames?.join(', ') || ''}
                  onChange={(e) => {
                    const classes = e.target.value.split(',').map(c => c.trim()).filter(c => c.length > 0)
                    setConfig(prev => ({ ...prev, classNames: classes }))
                  }}
                  rows={2}
                />
                <p className="text-xs text-gray-500 mt-1">
                  입력하면 학급 선택 드롭다운으로 표시됩니다. 비워두면 텍스트 입력으로 표시됩니다.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 생성 버튼 */}
        <Button 
          onClick={generateSurvey}
          disabled={isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              AI가 설문을 생성하고 있습니다...
            </div>
          ) : (
            '🤖 AI 설문 생성하기'
          )}
        </Button>

        <div className="text-xs text-gray-500 text-center">
          💡 생성된 설문은 Google Forms로 자동 변환되어 배포할 수 있습니다
        </div>
      </CardContent>
    </Card>
  )
}