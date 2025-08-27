import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json()
    
    if (!apiKey || !apiKey.startsWith('AIzaSy')) {
      return NextResponse.json({ 
        valid: false, 
        error: 'Invalid API key format' 
      }, { status: 400 })
    }

    // Gemini API 키 검증을 위한 간단한 테스트 요청
    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: "gemini-pro" })
      
      // 간단한 테스트 프롬프트로 API 키 유효성 검증
      const result = await model.generateContent("Hello")
      
      if (result.response) {
        return NextResponse.json({ valid: true })
      } else {
        return NextResponse.json({ 
          valid: false, 
          error: 'API key test failed' 
        }, { status: 400 })
      }
    } catch (error) {
      console.error('API key validation error:', error)
      return NextResponse.json({ 
        valid: false, 
        error: 'Invalid API key or quota exceeded' 
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Validation request error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}