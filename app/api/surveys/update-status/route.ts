import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/firebase'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  console.log('Survey status update API called')
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      console.log('No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { surveyId, status, formsUrl } = await request.json()
    console.log('Updating survey:', { surveyId, status, formsUrl })
    
    if (!surveyId || !status) {
      console.log('Missing surveyId or status')
      return NextResponse.json({ 
        error: 'Survey ID and status are required.' 
      }, { status: 400 })
    }

    // Firestore에서 설문 상태 업데이트
    console.log('Updating survey status in Firestore...')
    const surveyRef = doc(db, 'surveys', surveyId)
    
    const updateData: any = {
      status,
      updatedAt: serverTimestamp()
    }
    
    if (formsUrl) {
      updateData.formsUrl = formsUrl
    }
    
    await updateDoc(surveyRef, updateData)
    console.log('Survey status updated successfully')

    return NextResponse.json({ 
      success: true,
      message: '설문 상태가 업데이트되었습니다!'
    })

  } catch (error) {
    console.error('Survey status update error:', error)
    
    let errorMessage = '설문 상태 업데이트 중 오류가 발생했습니다.'
    
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
      errorMessage = `업데이트 오류: ${error.message}`
    }

    return NextResponse.json({ 
      success: false,
      error: errorMessage 
    }, { status: 500 })
  }
}