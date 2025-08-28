import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/firebase'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'

// 동적 API 라우트로 설정하여 정적 생성 오류 방지
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  console.log('Survey list API called')
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      console.log('No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Fetching surveys for user:', session.user.email)
    
    // 현재 사용자의 설문만 조회 (최신순)
    const surveysRef = collection(db, 'surveys')
    const q = query(
      surveysRef,
      where('userEmail', '==', session.user.email),
      orderBy('createdAt', 'desc')
    )

    const querySnapshot = await getDocs(q)
    const surveys: any[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      surveys.push({
        id: doc.id,
        ...data,
        // Firestore timestamp를 JSON serializable로 변환
        createdAt: data.createdAt?.toDate()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate()?.toISOString() || new Date().toISOString()
      })
    })

    console.log(`Found ${surveys.length} surveys for user`)

    return NextResponse.json({ 
      success: true, 
      surveys,
      count: surveys.length
    })

  } catch (error) {
    console.error('Survey list error:', error)
    
    let errorMessage = '설문 목록 조회 중 오류가 발생했습니다.'
    
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
      errorMessage = `조회 오류: ${error.message}`
    }

    return NextResponse.json({ 
      success: false,
      error: errorMessage 
    }, { status: 500 })
  }
}