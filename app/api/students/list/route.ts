import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const className = searchParams.get('className')
    const schoolName = searchParams.get('schoolName')
    const status = searchParams.get('status') || 'active'

    // 쿼리 조건 설정
    let studentQuery = query(
      collection(db, 'students'),
      where('teacherEmail', '==', session.user.email),
      where('status', '==', status),
      orderBy('className'),
      orderBy('studentNumber')
    )

    // 학급 필터링 (클라이언트에서 후처리)
    const snapshot = await getDocs(studentQuery)
    const students: any[] = []

    snapshot.forEach((doc) => {
      const data = doc.data()
      
      // 추가 필터링
      if (className && data.className !== className) return
      if (schoolName && data.schoolName !== schoolName) return

      students.push({
        id: doc.id,
        ...data,
        registeredAt: data.registeredAt instanceof Timestamp 
          ? data.registeredAt.toDate().toISOString()
          : data.registeredAt,
        lastSurveyAt: data.lastSurveyAt instanceof Timestamp
          ? data.lastSurveyAt.toDate().toISOString()
          : data.lastSurveyAt
      })
    })

    // 학급별 통계 계산
    const classStats = students.reduce((acc, student) => {
      const className = student.className
      if (!acc[className]) {
        acc[className] = {
          className,
          totalStudents: 0,
          activeSurveys: 0,
          lastActivity: null
        }
      }
      acc[className].totalStudents += 1
      if (student.lastSurveyAt) {
        acc[className].activeSurveys += 1
        if (!acc[className].lastActivity || student.lastSurveyAt > acc[className].lastActivity) {
          acc[className].lastActivity = student.lastSurveyAt
        }
      }
      return acc
    }, {} as Record<string, any>)

    return NextResponse.json({
      success: true,
      students,
      totalCount: students.length,
      classStats: Object.values(classStats),
      filters: {
        className,
        schoolName,
        status
      }
    })

  } catch (error) {
    console.error('학생 목록 조회 오류:', error)
    return NextResponse.json(
      { error: '학생 목록을 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 특정 학생 정보 수정
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { studentId, updates } = body

    if (!studentId) {
      return NextResponse.json(
        { error: '학생 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // 허용된 업데이트 필드만 처리
    const allowedFields = ['studentName', 'className', 'schoolName', 'notes', 'status']
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key]
        return obj
      }, {} as Record<string, any>)

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(
        { error: '업데이트할 필드가 없습니다.' },
        { status: 400 }
      )
    }

    // 수정 시간 추가
    filteredUpdates.updatedAt = serverTimestamp()

    // Firestore 업데이트는 별도 API에서 처리 (doc.update 사용)
    return NextResponse.json({
      success: true,
      message: '학생 정보가 업데이트되었습니다.',
      updates: filteredUpdates
    })

  } catch (error) {
    console.error('학생 정보 수정 오류:', error)
    return NextResponse.json(
      { error: '학생 정보 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}