import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'

// 동적 API 라우트로 설정
export const dynamic = 'force-dynamic'

// 특정 설문의 저장된 응답들을 조회하는 엔드포인트
export async function GET(
  request: NextRequest,
  { params }: { params: { surveyId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || !session.accessToken) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const { surveyId } = params
    console.log('저장된 응답 조회:', { surveyId, userEmail: session.user.email })

    // Firebase에서 해당 설문의 응답들 조회
    const responsesRef = collection(db, 'surveyResponses')
    const q = query(
      responsesRef,
      where('surveyId', '==', surveyId),
      where('teacherEmail', '==', session.user.email),
      orderBy('savedAt', 'desc')
    )

    const querySnapshot = await getDocs(q)
    const responses = querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        // Firestore timestamp를 JSON serializable로 변환
        savedAt: data.savedAt?.toDate()?.toISOString() || new Date().toISOString(),
        analyzedAt: data.analyzedAt?.toDate()?.toISOString() || null
      }
    })

    console.log(`${responses.length}개의 저장된 응답을 찾았습니다.`)

    return NextResponse.json({
      success: true,
      responses,
      count: responses.length,
      processedCount: responses.filter((r: any) => r.processed === true).length,
      analysisComplete: responses.filter((r: any) => r.analysisStatus === 'completed').length
    })

  } catch (error) {
    console.error('저장된 응답 조회 오류:', error)
    
    const errorMessage = error instanceof Error ? error.message : '응답 조회 중 오류가 발생했습니다.'
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}