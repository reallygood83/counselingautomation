import { Card, CardContent, CardHeader, CardTitle } from './Card'
import { Button } from './Button'
import { clsx } from 'clsx'

export interface StudentData {
  id: string
  name: string
  class: string
  lastSurveyDate?: string
  selScores: {
    selfAwareness: number
    selfManagement: number
    socialAwareness: number
    relationship: number
    decisionMaking: number
  }
  crisisLevel: 'normal' | 'attention' | 'warning' | 'critical'
  totalSurveys: number
}

interface StudentCardProps {
  student: StudentData
  onViewDetails?: (studentId: string) => void
  compact?: boolean
}

const crisisConfig = {
  normal: { label: '정상', color: 'crisis-normal', icon: '😊' },
  attention: { label: '관심', color: 'crisis-attention', icon: '🤔' },
  warning: { label: '주의', color: 'crisis-warning', icon: '⚠️' },
  critical: { label: '위험', color: 'crisis-critical', icon: '🚨' }
}

export function StudentCard({ 
  student, 
  onViewDetails, 
  compact = false 
}: StudentCardProps) {
  const crisis = crisisConfig[student.crisisLevel]
  const averageScore = Object.values(student.selScores).reduce((a, b) => a + b, 0) / 5

  return (
    <Card className={clsx(
      "transition-all duration-200 hover:shadow-md",
      compact ? "p-4" : ""
    )}>
      <CardHeader className={compact ? "pb-3" : ""}>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className={clsx(
              "flex items-center gap-2",
              compact ? "text-base" : "text-lg"
            )}>
              {student.name}
              <span className={clsx("crisis-indicator", crisis.color)}>
                {crisis.icon} {crisis.label}
              </span>
            </CardTitle>
            <p className={clsx(
              "text-gray-600 mt-1",
              compact ? "text-xs" : "text-sm"
            )}>
              {student.class} | 설문 {student.totalSurveys}회
            </p>
          </div>
          <div className="text-right">
            <div className={clsx(
              "font-bold",
              compact ? "text-lg" : "text-xl",
              averageScore >= 4 ? "text-green-600" :
              averageScore >= 3 ? "text-yellow-600" : "text-red-600"
            )}>
              {averageScore.toFixed(1)}
            </div>
            <p className={clsx(
              "text-gray-500",
              compact ? "text-xs" : "text-sm"
            )}>
              SEL 평균
            </p>
            {/* 상세보기 버튼을 SEL 점수 아래로 이동 */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails?.(student.id)}
              className="mt-2 px-3 py-1 text-xs bg-gradient-to-r from-teal-50 to-purple-50 border-teal-200 text-teal-700 hover:from-teal-100 hover:to-purple-100 hover:border-teal-300 transition-all duration-200"
            >
              상세보기
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className={compact ? "pt-0 pb-3" : ""}>
        {!compact && (
          <div className="grid grid-cols-5 gap-2 mb-4">
            {Object.entries(student.selScores).map(([key, score]) => {
              const labels = {
                selfAwareness: '자기인식',
                selfManagement: '자기관리',
                socialAwareness: '사회인식',
                relationship: '관계기술',
                decisionMaking: '의사결정'
              }
              
              return (
                <div key={key} className="text-center">
                  <div className={clsx(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white mx-auto mb-1",
                    score >= 4 ? "bg-green-500" :
                    score >= 3 ? "bg-yellow-500" : "bg-red-500"
                  )}>
                    {score}
                  </div>
                  <p className="text-xs text-gray-600">
                    {labels[key as keyof typeof labels]}
                  </p>
                </div>
              )
            })}
          </div>
        )}

        {student.lastSurveyDate && (
          <p className={clsx(
            "text-gray-500",
            compact ? "text-xs" : "text-sm"
          )}>
            최근 설문: {student.lastSurveyDate}
          </p>
        )}
      </CardContent>
    </Card>
  )
}