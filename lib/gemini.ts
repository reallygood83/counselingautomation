// Gemini AI 클라이언트
interface SelQuestion {
  category: 'selfAwareness' | 'selfManagement' | 'socialAwareness' | 'relationship' | 'decisionMaking'
  question: string
  options: string[]
  weight: number
}

interface SurveyConfig {
  targetGrade: string
  studentName?: string
  focusAreas?: string[]
  difficultyLevel: 'basic' | 'standard' | 'advanced'
}

// 기본 모델: 환경변수로 오버라이드 가능
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

export class GeminiClient {
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY!
    if (!this.apiKey) {
      throw new Error('Gemini API 키가 제공되지 않았습니다.')
    }
  }

  // SEL 설문 문항 생성
  async generateSelQuestions(config: SurveyConfig): Promise<SelQuestion[]> {
    console.log('Gemini generateSelQuestions 시작:', { 
      config, 
      hasApiKey: !!this.apiKey,
      apiKeyPrefix: this.apiKey ? this.apiKey.substring(0, 10) + '...' : 'none'
    })
    
    const prompt = this.buildSelPrompt(config)
    console.log('Gemini 프롬프트 생성 완료:', { 
      promptLength: prompt.length,
      promptPreview: prompt.substring(0, 200) + '...'
    })
    
    try {
      console.log('Gemini API 호출 시작...')
      const model = DEFAULT_GEMINI_MODEL
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      })

      console.log('Gemini API 응답 수신:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Gemini API 오류 상세:', {
          status: response.status,
          statusText: response.statusText,
          errorBody: errorText
        })
        // 모델/키 오류에 대해 사용자 친화적인 로그 남기고 기본 문항으로 폴백
        if (response.status === 404 && errorText.includes('model')) {
          console.warn(`Gemini 모델(${model})을 찾을 수 없습니다. 기본 문항으로 폴백합니다.`)
        } else if (response.status === 401 || response.status === 403) {
          console.warn('Gemini API 키가 유효하지 않거나 권한이 없습니다. 기본 문항으로 폴백합니다.')
        } else {
          console.warn(`Gemini API 오류(${response.status} ${response.statusText}). 기본 문항으로 폴백합니다.`)
        }
        return this.getDefaultQuestions()
      }

      const data = await response.json()
      console.log('Gemini API JSON 파싱 성공:', {
        hasCandidates: !!data.candidates,
        candidatesLength: data.candidates?.length,
        hasContent: !!data.candidates?.[0]?.content
      })
      
      const generatedText = data.candidates[0].content.parts[0].text
      console.log('Gemini 응답 텍스트 추출 성공:', {
        textLength: generatedText.length,
        textPreview: generatedText.substring(0, 300) + '...'
      })
      
      const questions = this.parseSelQuestions(generatedText)
      console.log('Gemini 문항 파싱 완료:', {
        questionsCount: questions.length,
        questionCategories: questions.map(q => q.category)
      })
      
      return questions
      
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error('Gemini generateSelQuestions 오류 상세:', {
        error: err.message,
        stack: err.stack,
        name: err.name
      })
      // API 오류 등 모든 예외 상황에서 기본 문항으로 폴백
      console.warn('Gemini 호출 실패로 기본 문항을 반환합니다.')
      return this.getDefaultQuestions()
    }
  }

  // SEL 응답 분석 및 점수 계산
  async analyzeSelResponses(responses: Record<string, number>, questions: SelQuestion[]): Promise<{
    scores: {
      selfAwareness: number
      selfManagement: number
      socialAwareness: number
      relationship: number
      decisionMaking: number
    }
    insights: string
    recommendations: string[]
    crisisLevel: 'normal' | 'attention' | 'warning' | 'critical'
  }> {
    // 영역별 점수 계산
    const scores = this.calculateSelScores(responses, questions)
    
    // AI 분석 요청
    const analysisPrompt = this.buildAnalysisPrompt(scores, responses, questions)
    
    try {
      const model = DEFAULT_GEMINI_MODEL
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: analysisPrompt
            }]
          }]
        })
      })

      const data = await response.json()
      const analysisText = data.candidates[0].content.parts[0].text
      const analysis = this.parseAnalysis(analysisText)
      
      return {
        scores,
        insights: analysis.insights,
        recommendations: analysis.recommendations,
        crisisLevel: this.determineCrisisLevel(scores)
      }
      
    } catch (error) {
      console.error('SEL 분석 오류:', error)
      throw error
    }
  }

  // SEL 설문 프롬프트 구성
  private buildSelPrompt(config: SurveyConfig): string {
    return `
당신은 한국의 학교 상담 전문가입니다. ${config.targetGrade} 학생을 위한 SEL(사회정서학습) 설문지를 생성해주세요.

요구사항:
- 대상: ${config.targetGrade} 학생
- 난이도: ${config.difficultyLevel === 'basic' ? '기초' : config.difficultyLevel === 'standard' ? '표준' : '심화'}
${config.focusAreas ? `- 중점 영역: ${config.focusAreas.join(', ')}` : ''}

SEL 5대 영역:
1. 자기인식 (selfAwareness): 자신의 감정과 생각을 이해하는 능력
2. 자기관리 (selfManagement): 감정과 행동을 조절하는 능력  
3. 사회적 인식 (socialAwareness): 타인을 이해하고 공감하는 능력
4. 관계 기술 (relationship): 건강한 관계를 형성하고 유지하는 능력
5. 의사결정 (decisionMaking): 책임감 있는 선택을 하는 능력

각 영역별로 4개씩, 총 20개 문항을 생성하세요.

출력 형식 (JSON):
{
  "questions": [
    {
      "category": "selfAwareness",
      "question": "나는 내 감정이 왜 생기는지 잘 안다.",
      "options": ["전혀 그렇지 않다", "그렇지 않다", "보통이다", "그렇다", "매우 그렇다"],
      "weight": 1
    }
  ]
}

문항은 학생이 이해하기 쉬운 한국어로 작성하고, 긍정적인 방향으로 질문하세요.
`
  }

  // SEL 분석 프롬프트 구성
  private buildAnalysisPrompt(scores: any, responses: any, questions: SelQuestion[]): string {
    return `
학생의 SEL 평가 결과를 분석해주세요.

점수 결과:
- 자기인식: ${scores.selfAwareness}/5.0
- 자기관리: ${scores.selfManagement}/5.0
- 사회적 인식: ${scores.socialAwareness}/5.0
- 관계기술: ${scores.relationship}/5.0
- 의사결정: ${scores.decisionMaking}/5.0

다음 형식으로 분석해주세요:

{
  "insights": "학생의 전반적인 사회정서적 발달 상태와 특징을 3-4줄로 요약",
  "recommendations": [
    "구체적인 지도 방안 1",
    "구체적인 지도 방안 2", 
    "구체적인 지도 방안 3"
  ]
}

분석은 따뜻하고 격려적인 톤으로 작성하며, 실제 교육 현장에서 활용 가능한 구체적인 방안을 제시하세요.
`
  }

  // 생성된 문항 파싱
  private parseSelQuestions(text: string): SelQuestion[] {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON 형식을 찾을 수 없습니다.');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.questions || [];
    } catch (error) {
      console.error('문항 파싱 오류:', error);
      // 기본 문항 반환
      return this.getDefaultQuestions();
    }
  }

  // 분석 결과 파싱
  private parseAnalysis(text: string): { insights: string, recommendations: string[] } {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('분석 JSON 형식을 찾을 수 없습니다.');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        insights: parsed.insights || '분석 결과를 생성할 수 없습니다.',
        recommendations: parsed.recommendations || ['추가 관찰이 필요합니다.']
      };
    } catch (error) {
      console.error('분석 파싱 오류:', error);
      return {
        insights: '분석 결과를 생성할 수 없습니다.',
        recommendations: ['추가 관찰이 필요합니다.']
      };
    }
  }

  // SEL 점수 계산
  private calculateSelScores(responses: Record<string, number>, questions: SelQuestion[]) {
    const categoryScores = {
      selfAwareness: [] as number[],
      selfManagement: [] as number[],
      socialAwareness: [] as number[],
      relationship: [] as number[],
      decisionMaking: [] as number[]
    }

    questions.forEach((question, index) => {
      const response = responses[`q${index}`]
      if (response !== undefined) {
        categoryScores[question.category].push(response)
      }
    })

    return {
      selfAwareness: this.average(categoryScores.selfAwareness),
      selfManagement: this.average(categoryScores.selfManagement),
      socialAwareness: this.average(categoryScores.socialAwareness),
      relationship: this.average(categoryScores.relationship),
      decisionMaking: this.average(categoryScores.decisionMaking)
    }
  }

  // 위기 수준 판단
  private determineCrisisLevel(scores: any): 'normal' | 'attention' | 'warning' | 'critical' {
    const average = Object.values(scores).reduce((sum: number, score: any) => sum + score, 0) / 5
    const minScore = Math.min(...Object.values(scores) as number[])

    if (minScore <= 2.0 || average <= 2.5) return 'critical'
    if (minScore <= 2.5 || average <= 3.0) return 'warning'  
    if (minScore <= 3.0 || average <= 3.5) return 'attention'
    return 'normal'
  }

  // 평균 계산
  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length
  }

  // 기본 문항 (Gemini API 실패 시 사용)
  private getDefaultQuestions(): SelQuestion[] {
    return [
      // 자기인식 (4문항)
      {
        category: 'selfAwareness',
        question: '나는 내 감정이 왜 생기는지 잘 안다.',
        options: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'],
        weight: 1
      },
      {
        category: 'selfAwareness', 
        question: '나는 내가 좋아하는 것과 잘하는 것을 잘 안다.',
        options: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'],
        weight: 1
      },
      {
        category: 'selfAwareness',
        question: '나는 스트레스를 받을 때 내 몸의 변화를 느낄 수 있다.',
        options: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'],
        weight: 1
      },
      {
        category: 'selfAwareness',
        question: '나는 내 기분이 다른 사람에게 어떤 영향을 주는지 안다.',
        options: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'],
        weight: 1
      },

      // 자기관리 (4문항)
      {
        category: 'selfManagement',
        question: '나는 화가 날 때 진정하는 방법을 안다.',
        options: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'],
        weight: 1
      },
      {
        category: 'selfManagement',
        question: '나는 목표를 정하고 꾸준히 노력한다.',
        options: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'],
        weight: 1
      },
      {
        category: 'selfManagement',
        question: '나는 어려운 일이 있어도 포기하지 않고 계속 시도한다.',
        options: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'],
        weight: 1
      },
      {
        category: 'selfManagement',
        question: '나는 충동적으로 행동하기보다 생각한 후 행동한다.',
        options: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'],
        weight: 1
      },

      // 사회적 인식 (4문항)
      {
        category: 'socialAwareness',
        question: '나는 다른 사람의 표정을 보고 그 사람의 기분을 안다.',
        options: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'],
        weight: 1
      },
      {
        category: 'socialAwareness',
        question: '나는 친구가 도움이 필요할 때를 잘 안다.',
        options: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'],
        weight: 1
      },
      {
        category: 'socialAwareness',
        question: '나는 다른 사람의 입장에서 생각해본다.',
        options: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'],
        weight: 1
      },
      {
        category: 'socialAwareness',
        question: '나는 다양한 배경을 가진 사람들을 존중한다.',
        options: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'],
        weight: 1
      },

      // 관계기술 (4문항)
      {
        category: 'relationship',
        question: '나는 친구들과 의견이 다를 때 대화로 해결한다.',
        options: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'],
        weight: 1
      },
      {
        category: 'relationship',
        question: '나는 도움이 필요할 때 다른 사람에게 요청할 수 있다.',
        options: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'],
        weight: 1
      },
      {
        category: 'relationship',
        question: '나는 다른 사람의 말을 주의 깊게 듣는다.',
        options: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'],
        weight: 1
      },
      {
        category: 'relationship',
        question: '나는 팀 활동에서 다른 사람들과 잘 협력한다.',
        options: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'],
        weight: 1
      },

      // 의사결정 (4문항)
      {
        category: 'decisionMaking',
        question: '나는 선택하기 전에 여러 가지 방법을 생각해본다.',
        options: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'],
        weight: 1
      },
      {
        category: 'decisionMaking',
        question: '나는 내가 한 행동의 결과를 생각하고 행동한다.',
        options: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'],
        weight: 1
      },
      {
        category: 'decisionMaking',
        question: '나는 어려운 상황에서도 올바른 선택을 하려고 노력한다.',
        options: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'],
        weight: 1
      },
      {
        category: 'decisionMaking',
        question: '나는 내 행동에 대해 책임을 진다.',
        options: ['전혀 그렇지 않다', '그렇지 않다', '보통이다', '그렇다', '매우 그렇다'],
        weight: 1
      }
    ]
  }
}