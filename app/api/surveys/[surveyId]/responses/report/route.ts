import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'

export async function POST(
  request: NextRequest,
  { params }: { params: { surveyId: string } }
) {
  try {
    // 인증 확인
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { responseId } = await request.json()

    if (!responseId) {
      return NextResponse.json({ error: '응답 ID가 필요합니다' }, { status: 400 })
    }

    // 응답 문서 조회
    const responseDocRef = doc(db, 'surveyResponses', responseId)
    const responseDoc = await getDoc(responseDocRef)

    if (!responseDoc.exists()) {
      return NextResponse.json({ error: '응답을 찾을 수 없습니다' }, { status: 404 })
    }

    const responseData = responseDoc.data()
    
    // 교사 권한 확인
    if (responseData.teacherEmail !== session.user.email) {
      return NextResponse.json({ error: '리포트 생성 권한이 없습니다' }, { status: 403 })
    }

    // 분석이 완료되었는지 확인
    if (!responseData.selScores || responseData.analysisStatus !== 'completed') {
      return NextResponse.json({ 
        error: '분석이 완료되지 않은 응답입니다. 먼저 분석을 실행해주세요.' 
      }, { status: 400 })
    }

    // 학생 정보 추출
    const studentName = responseData.studentInfo?.name || responseData.studentName || '알 수 없음'
    const className = responseData.studentInfo?.class || responseData.className || ''
    const studentNumber = responseData.studentInfo?.number || responseData.studentNumber || 0

    // SEL 점수 및 분석 데이터
    const selScores = responseData.selScores
    const totalScore = responseData.totalScore || Object.values(selScores).reduce((sum: any, score: any) => sum + score, 0) / 5
    const insights = responseData.aiInsights || []
    const recommendations = responseData.recommendations || []
    const crisisLevel = responseData.crisisLevel || 'normal'
    const analyzedAt = responseData.analyzedAt?.toDate?.() || new Date()

    // SEL 영역별 한국어 이름과 설명
    const selAreas = {
      selfAwareness: { name: '자기인식', desc: '자신의 감정, 생각, 가치관을 정확히 파악하는 능력' },
      selfManagement: { name: '자기관리', desc: '감정과 행동을 효과적으로 조절하는 능력' },
      socialAwareness: { name: '사회적 인식', desc: '타인과 사회 상황을 이해하고 공감하는 능력' },
      relationship: { name: '관계 기술', desc: '건강한 인간관계를 형성하고 유지하는 능력' },
      decisionMaking: { name: '의사결정', desc: '윤리적이고 책임감 있는 선택을 하는 능력' }
    }

    // 위기 수준에 따른 색상 및 메시지
    const crisisInfo = {
      low: { color: '#22c55e', level: '양호', message: '전반적으로 안정적인 사회정서 발달 상태를 보입니다.' },
      moderate: { color: '#f59e0b', level: '주의', message: '일부 영역에서 지원이 필요한 상태입니다.' },
      high: { color: '#ef4444', level: '관심', message: '적극적인 상담과 지원이 필요한 상태입니다.' },
      critical: { color: '#dc2626', level: '긴급', message: '즉시 전문적인 개입이 필요한 상태입니다.' }
    }

    const currentCrisis = crisisInfo[crisisLevel as keyof typeof crisisInfo] || crisisInfo.low

    // HTML 리포트 생성
    const htmlReport = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${studentName} 학생 SEL 상담 리포트</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; color: #1f2937; }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); color: white; padding: 30px; border-radius: 15px; margin-bottom: 25px; }
        .header h1 { font-size: 2.2rem; margin-bottom: 10px; }
        .header .meta { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 20px; }
        .meta-item { background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; }
        .meta-label { font-size: 0.9rem; opacity: 0.8; margin-bottom: 5px; }
        .meta-value { font-size: 1.1rem; font-weight: 600; }
        .crisis-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: 600; margin-top: 10px; }
        .section { background: white; border-radius: 15px; padding: 25px; margin-bottom: 25px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); }
        .section-title { font-size: 1.5rem; margin-bottom: 20px; color: #1f2937; display: flex; align-items: center; gap: 10px; }
        .scores-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .score-card { text-align: center; padding: 20px; border-radius: 12px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); }
        .score-value { font-size: 2.5rem; font-weight: 700; color: #0284c7; margin-bottom: 5px; }
        .score-label { font-size: 0.95rem; color: #64748b; font-weight: 500; }
        .score-desc { font-size: 0.85rem; color: #64748b; margin-top: 5px; line-height: 1.4; }
        .chart-container { max-width: 600px; margin: 0 auto; }
        .insights-list, .recommendations-list { list-style: none; }
        .insights-list li, .recommendations-list li { background: #f8fafc; padding: 15px; border-radius: 10px; margin-bottom: 12px; border-left: 4px solid #3b82f6; }
        .total-score { text-align: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; border-radius: 15px; margin-bottom: 25px; }
        .total-score-value { font-size: 4rem; font-weight: 700; margin-bottom: 10px; }
        .total-score-label { font-size: 1.2rem; opacity: 0.9; }
        .footer { text-align: center; color: #64748b; font-size: 0.9rem; margin-top: 40px; }
        @media print { 
            body { background: white; } 
            .section { break-inside: avoid; box-shadow: none; border: 1px solid #e5e7eb; } 
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- 헤더 -->
        <div class="header">
            <h1>🎯 SEL 상담 리포트</h1>
            <div class="meta">
                <div class="meta-item">
                    <div class="meta-label">학생명</div>
                    <div class="meta-value">${studentName}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">학급</div>
                    <div class="meta-value">${className} ${studentNumber}번</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">분석일시</div>
                    <div class="meta-value">${analyzedAt.toLocaleString('ko-KR')}</div>
                </div>
                <div class="meta-item">
                    <div class="meta-label">위기 수준</div>
                    <div class="crisis-badge" style="background-color: ${currentCrisis.color};">
                        ${currentCrisis.level}
                    </div>
                </div>
            </div>
        </div>

        <!-- 종합 점수 -->
        <div class="total-score">
            <div class="total-score-value">${totalScore.toFixed(1)}/5.0</div>
            <div class="total-score-label">SEL 종합 점수</div>
            <p style="margin-top: 15px; opacity: 0.9;">${currentCrisis.message}</p>
        </div>

        <!-- SEL 영역별 점수 -->
        <div class="section">
            <h2 class="section-title">📊 SEL 영역별 분석</h2>
            <div class="scores-grid">
                ${Object.entries(selScores).map(([key, score]: [string, any]) => `
                    <div class="score-card">
                        <div class="score-value">${score.toFixed(1)}</div>
                        <div class="score-label">${(selAreas as any)[key]?.name || key}</div>
                        <div class="score-desc">${(selAreas as any)[key]?.desc || ''}</div>
                    </div>
                `).join('')}
            </div>
            
            <div class="chart-container">
                <canvas id="selChart" width="400" height="400"></canvas>
            </div>
        </div>

        <!-- AI 분석 인사이트 -->
        <div class="section">
            <h2 class="section-title">🔍 AI 분석 인사이트</h2>
            <ul class="insights-list">
                ${insights.map((insight: string) => `<li>${insight}</li>`).join('')}
            </ul>
        </div>

        <!-- 상담 권고사항 -->
        <div class="section">
            <h2 class="section-title">💡 상담 권고사항</h2>
            <ul class="recommendations-list">
                ${recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
            </ul>
        </div>

        <div class="footer">
            <p>본 리포트는 MIRA 학생 상담 자동화 시스템에 의해 생성되었습니다.</p>
            <p>생성일시: ${new Date().toLocaleString('ko-KR')}</p>
        </div>
    </div>

    <script>
        // SEL 레이더 차트 생성
        const ctx = document.getElementById('selChart').getContext('2d');
        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['자기인식', '자기관리', '사회적 인식', '관계 기술', '의사결정'],
                datasets: [{
                    label: 'SEL 점수',
                    data: [${selScores.selfAwareness}, ${selScores.selfManagement}, ${selScores.socialAwareness}, ${selScores.relationship}, ${selScores.decisionMaking}],
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 5,
                        ticks: {
                            stepSize: 1
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    </script>
</body>
</html>`

    return NextResponse.json({
      success: true,
      message: `${studentName} 학생의 상담 리포트가 생성되었습니다`,
      report: {
        studentName,
        className,
        studentNumber,
        totalScore: totalScore.toFixed(1),
        crisisLevel: currentCrisis.level,
        htmlContent: htmlReport,
        generatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('상담 리포트 생성 중 오류:', error)
    return NextResponse.json(
      { error: '상담 리포트 생성 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}