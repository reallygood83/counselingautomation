import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/firebase'
import { doc, deleteDoc, getDoc } from 'firebase/firestore'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { surveyId: string } }
) {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const url = new URL(request.url)
    const responseId = url.searchParams.get('responseId')

    if (!responseId) {
      return NextResponse.json({ error: '응답 ID가 필요합니다' }, { status: 400 })
    }

    // 응답 문서 참조
    const responseDocRef = doc(db, 'surveyResponses', responseId)
    
    // 응답이 존재하는지 확인하고 권한 검증
    const responseDoc = await getDoc(responseDocRef)
    if (!responseDoc.exists()) {
      return NextResponse.json({ error: '응답을 찾을 수 없습니다' }, { status: 404 })
    }

    const responseData = responseDoc.data()
    
    // 교사 권한 확인 (해당 교사의 응답만 삭제 가능)
    if (responseData.teacherEmail !== session.user.email) {
      return NextResponse.json({ error: '삭제 권한이 없습니다' }, { status: 403 })
    }

    // 응답 삭제 실행
    await deleteDoc(responseDocRef)

    return NextResponse.json({
      success: true,
      message: `응답이 성공적으로 삭제되었습니다 (ID: ${responseId})`
    })

  } catch (error) {
    console.error('응답 삭제 중 오류:', error)
    return NextResponse.json(
      { error: '응답 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}