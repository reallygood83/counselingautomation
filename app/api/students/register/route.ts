import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { studentName, studentNumber, className, schoolName } = body

    // 필수 필드 검증
    if (!studentName || !studentNumber || !className) {
      return NextResponse.json(
        { error: '학생명, 학번, 학급은 필수 입력 항목입니다.' },
        { status: 400 }
      )
    }

    // 중복 검사 (같은 교사의 같은 학급에서 학번 중복 방지)
    const duplicateQuery = query(
      collection(db, 'students'),
      where('teacherEmail', '==', session.user.email),
      where('className', '==', className),
      where('studentNumber', '==', studentNumber)
    )
    const duplicateDocs = await getDocs(duplicateQuery)
    
    if (!duplicateDocs.empty) {
      return NextResponse.json(
        { error: `${className}에 이미 ${studentNumber}번 학생이 등록되어 있습니다.` },
        { status: 409 }
      )
    }

    // 학생 데이터 생성
    const studentData = {
      studentName: studentName.trim(),
      studentNumber: parseInt(studentNumber),
      className: className.trim(),
      schoolName: schoolName?.trim() || '',
      teacherEmail: session.user.email,
      teacherName: session.user.name || '',
      registeredAt: serverTimestamp(),
      status: 'active', // active, inactive
      surveyCount: 0, // 참여한 설문 수
      lastSurveyAt: null, // 마지막 설문 참여 날짜
      notes: '' // 교사 메모
    }

    // Firestore에 학생 데이터 저장
    const docRef = await addDoc(collection(db, 'students'), studentData)

    return NextResponse.json({
      success: true,
      studentId: docRef.id,
      message: `${studentName} 학생이 성공적으로 등록되었습니다.`,
      student: {
        id: docRef.id,
        ...studentData,
        registeredAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('학생 등록 오류:', error)
    return NextResponse.json(
      { error: '학생 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// CSV 일괄 등록 지원
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { students } = body // 학생 배열

    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json(
        { error: '등록할 학생 목록이 필요합니다.' },
        { status: 400 }
      )
    }

    const results = []
    const errors = []

    for (const student of students) {
      try {
        const { studentName, studentNumber, className, schoolName } = student

        // 필수 필드 검증
        if (!studentName || !studentNumber || !className) {
          errors.push({
            student: studentName || '이름없음',
            error: '학생명, 학번, 학급은 필수 입력 항목입니다.'
          })
          continue
        }

        // 중복 검사
        const duplicateQuery = query(
          collection(db, 'students'),
          where('teacherEmail', '==', session.user.email),
          where('className', '==', className),
          where('studentNumber', '==', parseInt(studentNumber))
        )
        const duplicateDocs = await getDocs(duplicateQuery)
        
        if (!duplicateDocs.empty) {
          errors.push({
            student: studentName,
            error: `${className}에 이미 ${studentNumber}번 학생이 존재합니다.`
          })
          continue
        }

        // 학생 데이터 생성
        const studentData = {
          studentName: studentName.trim(),
          studentNumber: parseInt(studentNumber),
          className: className.trim(),
          schoolName: schoolName?.trim() || '',
          teacherEmail: session.user.email,
          teacherName: session.user.name || '',
          registeredAt: serverTimestamp(),
          status: 'active',
          surveyCount: 0,
          lastSurveyAt: null,
          notes: ''
        }

        const docRef = await addDoc(collection(db, 'students'), studentData)
        results.push({
          id: docRef.id,
          studentName,
          className,
          studentNumber
        })

      } catch (error) {
        console.error(`학생 ${student.studentName} 등록 실패:`, error)
        errors.push({
          student: student.studentName || '이름없음',
          error: '등록 중 오류가 발생했습니다.'
        })
      }
    }

    return NextResponse.json({
      success: true,
      registered: results.length,
      failed: errors.length,
      results,
      errors,
      message: `${results.length}명 등록 완료, ${errors.length}명 실패`
    })

  } catch (error) {
    console.error('일괄 학생 등록 오류:', error)
    return NextResponse.json(
      { error: '일괄 학생 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}