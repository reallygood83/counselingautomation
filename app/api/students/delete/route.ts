import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/firebase'
import { doc, deleteDoc, getDoc } from 'firebase/firestore'

export async function DELETE(request: NextRequest) {
  try {
    console.log('학생 삭제 API 호출 시작')
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      console.log('인증 실패: 세션 없음')
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json(
        { error: '학생 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    console.log('삭제 대상 학생 ID:', studentId)

    // 학생 정보 확인 (권한 체크)
    const studentRef = doc(db, 'students', studentId)
    const studentSnap = await getDoc(studentRef)

    if (!studentSnap.exists()) {
      console.log('학생을 찾을 수 없음:', studentId)
      return NextResponse.json(
        { error: '학생을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const studentData = studentSnap.data()
    
    // 권한 확인: 해당 교사가 등록한 학생인지 확인
    if (studentData.teacherEmail !== session.user.email) {
      console.log('삭제 권한 없음:', { 
        studentTeacher: studentData.teacherEmail, 
        currentUser: session.user.email 
      })
      return NextResponse.json(
        { error: '이 학생을 삭제할 권한이 없습니다.' },
        { status: 403 }
      )
    }

    console.log('학생 삭제 중:', { 
      name: studentData.studentName, 
      class: studentData.className,
      number: studentData.studentNumber 
    })

    // 학생 삭제
    await deleteDoc(studentRef)
    
    console.log('학생 삭제 완료:', studentId)

    return NextResponse.json({
      success: true,
      message: `${studentData.studentName} 학생이 삭제되었습니다.`,
      deletedStudent: {
        id: studentId,
        name: studentData.studentName,
        className: studentData.className,
        studentNumber: studentData.studentNumber
      }
    })

  } catch (error) {
    console.error('학생 삭제 오류:', error)
    return NextResponse.json(
      { error: '학생 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}