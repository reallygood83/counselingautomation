'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface Student {
  id: string
  studentName: string
  studentNumber: number
  className: string
  schoolName: string
  status: 'active' | 'inactive'
  surveyCount: number
  lastSurveyAt?: string
  registeredAt: string
  notes?: string
}

interface ClassStats {
  className: string
  totalStudents: number
  activeSurveys: number
  lastActivity?: string
}

export function StudentManager() {
  const [students, setStudents] = useState<Student[]>([])
  const [classStats, setClassStats] = useState<ClassStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // 필터 상태
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  
  // 모달 상태
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  
  // 폼 상태
  const [newStudent, setNewStudent] = useState({
    studentName: '',
    studentNumber: '',
    className: '',
    schoolName: ''
  })
  
  // 대량 등록 상태
  const [bulkData, setBulkData] = useState('')

  // 학생 목록 로드
  const loadStudents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedClass) params.append('className', selectedClass)
      
      const response = await fetch(`/api/students/list?${params}`)
      if (!response.ok) throw new Error('학생 목록 로드 실패')
      
      const data = await response.json()
      setStudents(data.students || [])
      setClassStats(data.classStats || [])
      setError('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStudents()
  }, [selectedClass])

  // 개별 학생 등록
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newStudent.studentName || !newStudent.studentNumber || !newStudent.className) {
      setError('학생명, 학번, 학급은 필수 입력 항목입니다.')
      return
    }

    try {
      const response = await fetch('/api/students/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '학생 등록 실패')
      }

      const data = await response.json()
      alert(data.message)
      
      setNewStudent({ studentName: '', studentNumber: '', className: '', schoolName: '' })
      setShowAddModal(false)
      loadStudents()
    } catch (err) {
      setError(err instanceof Error ? err.message : '학생 등록 실패')
    }
  }

  // 학생 삭제
  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (!confirm(`정말로 "${studentName}" 학생을 삭제하시겠습니까?\n\n삭제된 학생의 설문 응답 데이터도 함께 삭제됩니다.`)) {
      return
    }

    try {
      const response = await fetch(`/api/students/delete?studentId=${studentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '학생 삭제 실패')
      }

      const data = await response.json()
      alert(data.message)
      loadStudents() // 목록 새로고침
    } catch (err) {
      setError(err instanceof Error ? err.message : '학생 삭제 실패')
    }
  }

  // CSV 대량 등록
  const handleBulkUpload = async () => {
    if (!bulkData.trim()) {
      setError('CSV 데이터를 입력해주세요.')
      return
    }

    try {
      // CSV 데이터 파싱
      const lines = bulkData.trim().split('\n')
      const students = lines.slice(1).map(line => { // 첫 줄은 헤더로 가정
        const [studentName, studentNumber, className, schoolName] = line.split(',').map(s => s.trim())
        return { studentName, studentNumber, className, schoolName: schoolName || '' }
      })

      const response = await fetch('/api/students/register', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ students })
      })

      if (!response.ok) throw new Error('대량 등록 실패')

      const data = await response.json()
      alert(`등록 완료: ${data.registered}명 성공, ${data.failed}명 실패`)
      
      if (data.errors?.length > 0) {
        console.error('등록 실패 학생들:', data.errors)
      }

      setBulkData('')
      setShowBulkModal(false)
      loadStudents()
    } catch (err) {
      setError(err instanceof Error ? err.message : '대량 등록 실패')
    }
  }

  // 필터링된 학생 목록
  const filteredStudents = students.filter(student => {
    const matchesSearch = searchTerm === '' || 
      student.studentName.includes(searchTerm) ||
      student.className.includes(searchTerm)
    return matchesSearch
  })

  // 고유 학급 목록
  const uniqueClasses = Array.from(new Set(students.map(s => s.className))).sort()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">학생 관리</h2>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            학생 등록
          </Button>
          <Button
            onClick={() => setShowBulkModal(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            CSV 대량등록
          </Button>
        </div>
      </div>

      {/* 학급별 통계 */}
      {classStats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classStats.map(stat => (
            <Card key={stat.className} className="p-4">
              <h3 className="font-semibold text-lg mb-2">{stat.className}</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div>총 학생: {stat.totalStudents}명</div>
                <div>설문 참여: {stat.activeSurveys}명</div>
                {stat.lastActivity && (
                  <div>마지막 활동: {new Date(stat.lastActivity).toLocaleDateString()}</div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 검색 및 필터 */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <input
            type="text"
            placeholder="학생명 또는 학급으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">모든 학급</option>
            {uniqueClasses.map(className => (
              <option key={className} value={className}>{className}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 오류 메시지 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700">
          {error}
        </div>
      )}

      {/* 학생 목록 테이블 */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">학생 목록을 불러오는 중...</p>
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    학생명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    학급
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    번호
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    설문 참여
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    등록일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{student.studentName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.className}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.studentNumber}번</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {student.surveyCount}회
                        {student.lastSurveyAt && (
                          <div className="text-xs text-gray-500">
                            최근: {new Date(student.lastSurveyAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        student.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {student.status === 'active' ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(student.registeredAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button
                        onClick={() => handleDeleteStudent(student.id, student.studentName)}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1"
                      >
                        삭제
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredStudents.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                등록된 학생이 없습니다.
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 개별 등록 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">새 학생 등록</h3>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  학생명 *
                </label>
                <input
                  type="text"
                  value={newStudent.studentName}
                  onChange={(e) => setNewStudent({...newStudent, studentName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  학급 *
                </label>
                <input
                  type="text"
                  placeholder="예: 3-1, 4-2"
                  value={newStudent.className}
                  onChange={(e) => setNewStudent({...newStudent, className: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  번호 *
                </label>
                <input
                  type="number"
                  value={newStudent.studentNumber}
                  onChange={(e) => setNewStudent({...newStudent, studentNumber: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  학교명 (선택)
                </label>
                <input
                  type="text"
                  value={newStudent.schoolName}
                  onChange={(e) => setNewStudent({...newStudent, schoolName: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700">
                  등록
                </Button>
                <Button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600"
                >
                  취소
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV 대량 등록 모달 */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">CSV 대량 등록</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CSV 형식 (첫 줄: 헤더)
                </label>
                <div className="text-xs text-gray-500 mb-2">
                  형식: 학생명,번호,학급,학교명
                </div>
                <textarea
                  value={bulkData}
                  onChange={(e) => setBulkData(e.target.value)}
                  placeholder={`학생명,번호,학급,학교명
김철수,15,3-1,박달초
이영희,16,3-1,박달초
박민수,17,3-2,박달초`}
                  className="w-full h-40 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleBulkUpload}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  대량 등록
                </Button>
                <Button 
                  onClick={() => setShowBulkModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600"
                >
                  취소
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}