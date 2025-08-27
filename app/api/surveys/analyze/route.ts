import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../auth/[...nextauth]/route'
import { GeminiClient } from '@/lib/gemini'
import { GoogleSheetsClient } from '@/lib/googleSheets'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { surveyId, studentName, className, responses, questions, spreadsheetId } = body

    if (!responses || !questions || !studentName) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // Gemini AI로 SEL 응답 분석
    const geminiClient = new GeminiClient()
    const analysis = await geminiClient.analyzeSelResponses(responses, questions)

    // Google Sheets에 결과 저장
    if (spreadsheetId) {
      const sheetsClient = new GoogleSheetsClient(session.accessToken)
      await sheetsClient.saveSelAnalysis(
        spreadsheetId,
        studentName,
        className || '',
        analysis.scores,
        analysis.crisisLevel,
        analysis.insights
      )
    }

    return NextResponse.json({
      success: true,
      analysis: {
        scores: analysis.scores,
        insights: analysis.insights,
        recommendations: analysis.recommendations,
        crisisLevel: analysis.crisisLevel,
        summary: {
          totalScore: Object.values(analysis.scores).reduce((sum, score) => sum + score, 0) / 5,
          strongestArea: Object.entries(analysis.scores).reduce((max, [key, value]) => 
            value > max.value ? { area: key, value } : max, 
            { area: '', value: 0 }
          ),
          weakestArea: Object.entries(analysis.scores).reduce((min, [key, value]) => 
            value < min.value ? { area: key, value } : min, 
            { area: '', value: 5 }
          )
        },
        analyzedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('설문 분석 오류:', error)
    return NextResponse.json(
      { error: '설문 분석 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// SEL 영역 한국어 이름 매핑
function getAreaNameInKorean(area: string): string {
  const areaNames: Record<string, string> = {
    selfAwareness: '자기인식',
    selfManagement: '자기관리', 
    socialAwareness: '사회적 인식',
    relationship: '관계기술',
    decisionMaking: '의사결정'
  }
  return areaNames[area] || area
}