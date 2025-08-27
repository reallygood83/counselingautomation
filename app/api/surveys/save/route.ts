import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

export async function POST(request: NextRequest) {
  console.log('Survey save API called')
  
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      console.log('No session found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const survey = await request.json()
    console.log('Survey data to save:', JSON.stringify(survey, null, 2))
    
    if (!survey || !survey.title || !survey.questions) {
      console.log('Invalid survey data for saving')
      return NextResponse.json({ 
        error: 'Invalid survey data. Title and questions are required.' 
      }, { status: 400 })
    }

    // Firestore에 설문 저장
    console.log('Saving survey to Firestore...')
    const surveyDoc = {
      ...survey,
      userEmail: session.user.email,
      userName: session.user.name || 'Unknown',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: 'created' as const, // created, deployed, completed
      formsUrl: null, // Google Forms URL (배포 후 업데이트)
      responseCount: 0
    }

    const docRef = await addDoc(collection(db, 'surveys'), surveyDoc)
    console.log('Survey saved with ID:', docRef.id)

    return NextResponse.json({ 
      success: true, 
      id: docRef.id,
      message: '설문이 성공적으로 저장되었습니다!'
    })

  } catch (error) {
    console.error('Survey save error:', error)
    
    let errorMessage = '설문 저장 중 오류가 발생했습니다.'
    
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      })
      errorMessage = `저장 오류: ${error.message}`
    }

    return NextResponse.json({ 
      success: false,
      error: errorMessage 
    }, { status: 500 })
  }
}