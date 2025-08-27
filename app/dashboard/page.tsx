'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StudentCard, type StudentData } from '@/components/ui/StudentCard'
import { SELChart } from '@/components/charts/SELChart'
import { AuthButton } from '@/components/auth/AuthButton'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

// Mock data for demonstration
const mockStudents: StudentData[] = [
  {
    id: '1',
    name: '김민수',
    class: '3학년 2반',
    lastSurveyDate: '2024-01-15',
    selScores: {
      selfAwareness: 4.2,
      selfManagement: 3.8,
      socialAwareness: 4.0,
      relationship: 3.5,
      decisionMaking: 3.9
    },
    crisisLevel: 'normal',
    totalSurveys: 3
  },
  {
    id: '2',
    name: '이지은',
    class: '3학년 2반',
    lastSurveyDate: '2024-01-14',
    selScores: {
      selfAwareness: 2.8,
      selfManagement: 2.5,
      socialAwareness: 3.0,
      relationship: 2.2,
      decisionMaking: 2.7
    },
    crisisLevel: 'warning',
    totalSurveys: 2
  },
  {
    id: '3',
    name: '박준호',
    class: '3학년 1반',
    lastSurveyDate: '2024-01-13',
    selScores: {
      selfAwareness: 3.5,
      selfManagement: 3.7,
      socialAwareness: 3.8,
      relationship: 4.1,
      decisionMaking: 3.6
    },
    crisisLevel: 'attention',
    totalSurveys: 4
  }
]

export default function Dashboard() {
  const { data: session, status } = useSession()
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null)

  const handleViewDetails = (studentId: string) => {
    const student = mockStudents.find(s => s.id === studentId)
    setSelectedStudent(student || null)
  }

  const handleCreateSurvey = (studentId: string) => {
    console.log('Creating survey for student:', studentId)
    window.location.href = '/surveys'
  }

  const totalStudents = mockStudents.length
  const criticalStudents = mockStudents.filter(s => s.crisisLevel === 'critical').length
  const warningStudents = mockStudents.filter(s => s.crisisLevel === 'warning').length
  const recentSurveys = mockStudents.filter(s => s.lastSurveyDate).length

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">로딩중...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    window.location.href = '/'
    return null
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2 cursor-pointer hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">M</span>
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-purple-600 bg-clip-text text-transparent">
                  MIRA Dashboard
                </h1>
              </div>
              <p className="text-gray-600 mt-2">학생들의 내면과 감정을 반영한 SEL 현황을 한눈에 확인하세요</p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/settings">
                <Button variant="outline">
                  ⚙️ 설정
                </Button>
              </Link>
              <AuthButton />
              <Link href="/surveys">
                <Button size="lg" variant="mira">
                  💖 SEL 설문 생성
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-teal-600">{totalStudents}</div>
                <p className="text-sm text-gray-600">전체 학생</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{recentSurveys}</div>
                <p className="text-sm text-gray-600">최근 설문</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-amber-600">{warningStudents}</div>
                <p className="text-sm text-gray-600">주의 학생</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-rose-600">{criticalStudents}</div>
                <p className="text-sm text-gray-600">위험 학생</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Student List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>학생 목록</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockStudents.map((student) => (
                    <StudentCard
                      key={student.id}
                      student={student}
                      onViewDetails={handleViewDetails}
                      onCreateSurvey={handleCreateSurvey}
                      compact
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Student Detail */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>상세 분석</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedStudent ? (
                  <div>
                    <SELChart
                      data={selectedStudent.selScores}
                      studentName={selectedStudent.name}
                      size="sm"
                      showLegend={false}
                    />
                    <div className="mt-6 space-y-3">
                      <Button className="w-full" variant="outline">
                        상담 기록 보기
                      </Button>
                      <Button className="w-full">
                        보고서 생성
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      🪞
                    </div>
                    <p>학생을 선택하면<br />내면과 감정 분석을 확인할 수 있습니다</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>빠른 작업</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="h-16 flex flex-col gap-1"
                  onClick={() => window.location.href = '/surveys'}
                >
                  <span className="text-lg">💖</span>
                  <span className="text-sm">SEL 설문</span>
                </Button>
                <Button variant="outline" className="h-16 flex flex-col gap-1">
                  <span className="text-lg">🪞</span>
                  <span className="text-sm">감정 분석</span>
                </Button>
                <Button variant="outline" className="h-16 flex flex-col gap-1">
                  <span className="text-lg">📈</span>
                  <span className="text-sm">SEL 보고서</span>
                </Button>
                <Button variant="outline" className="h-16 flex flex-col gap-1">
                  <span className="text-lg">🔗</span>
                  <span className="text-sm">Google 연동</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}