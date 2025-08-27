'use client'

import React from 'react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface SurveyPreviewModalProps {
  survey: any
  isOpen: boolean
  onClose: () => void
  onDeploy: (survey: any) => void
}

const categoryLabels: Record<string, string> = {
  selfAwareness: '자기인식',
  selfManagement: '자기관리', 
  socialAwareness: '사회적 인식',
  relationship: '관계 기술',
  decisionMaking: '책임감 있는 의사결정'
}

const categoryColors: Record<string, string> = {
  selfAwareness: 'bg-teal-100 text-teal-800 border-teal-200',
  selfManagement: 'bg-purple-100 text-purple-800 border-purple-200',
  socialAwareness: 'bg-pink-100 text-pink-800 border-pink-200',
  relationship: 'bg-blue-100 text-blue-800 border-blue-200',
  decisionMaking: 'bg-indigo-100 text-indigo-800 border-indigo-200'
}

export function SurveyPreviewModal({ survey, isOpen, onClose, onDeploy }: SurveyPreviewModalProps) {
  if (!isOpen || !survey) return null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    })
  }

  const handleDeployClick = () => {
    onDeploy(survey)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-none shadow-none">
          <CardHeader className="border-b bg-gradient-to-r from-teal-50 to-purple-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                  {survey.title}
                </CardTitle>
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <span>📚 {survey.targetGrade}</span>
                  <span>📊 {survey.questions?.length || 0}문항</span>
                  <span>⭐ {survey.difficultyLevel}</span>
                  <span>📅 {formatDate(survey.createdAt)}</span>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* 설문 설명 */}
            {survey.description && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border-l-4 border-teal-500">
                <h3 className="font-medium text-gray-900 mb-2">📋 설문 설명</h3>
                <p className="text-gray-700 leading-relaxed">{survey.description}</p>
              </div>
            )}

            {/* 설문 문항들 */}
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-900 border-b-2 border-teal-500 pb-2">
                📝 설문 문항 ({survey.questions?.length || 0}개)
              </h3>
              
              {survey.questions?.map((question: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 bg-gradient-to-br from-teal-500 to-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </span>
                      {question.category && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${categoryColors[question.category] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                          {categoryLabels[question.category] || question.category}
                        </span>
                      )}
                    </div>
                    {question.weight && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        가중치: {question.weight}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-900 font-medium mb-4 text-base leading-relaxed">
                    {question.question}
                  </p>
                  
                  {question.options && question.options.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 font-medium">응답 선택지:</p>
                      <div className="grid grid-cols-1 gap-2">
                        {question.options.map((option: string, optionIndex: number) => (
                          <label key={optionIndex} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                            <input
                              type="radio"
                              name={`question-${index}`}
                              value={option}
                              disabled
                              className="w-4 h-4 text-teal-600"
                            />
                            <span className="text-gray-800 text-sm">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-teal-50 border border-teal-200 rounded-lg p-3">
                      <p className="text-sm text-teal-700 font-medium">
                        📊 5점 척도 평가 (1: 전혀 아니다 ~ 5: 매우 그렇다)
                      </p>
                      <div className="flex items-center justify-between mt-2 text-xs text-teal-600">
                        <span>1점: 전혀 아니다</span>
                        <span>2점: 별로 아니다</span>
                        <span>3점: 보통이다</span>
                        <span>4점: 약간 그렇다</span>
                        <span>5점: 매우 그렇다</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 액션 버튼들 */}
            <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={onClose}
                className="px-6 py-2"
              >
                닫기
              </Button>
              <Button
                variant="mira"
                onClick={handleDeployClick}
                className="px-6 py-2 font-medium"
              >
                📝 Google Forms로 배포하기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}