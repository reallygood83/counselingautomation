import { google } from 'googleapis'
import { GoogleDriveClient } from './googleDrive'

export interface FormQuestion {
  question: string
  options?: string[]
  type: 'multiple_choice' | 'checkbox' | 'short_answer' | 'paragraph' | 'linear_scale'
  category?: string
  weight?: number
}

export interface CreateFormRequest {
  title: string
  description: string
  questions: FormQuestion[]
}

export class GoogleFormsClient {
  private accessToken: string | null = null
  private userEmail: string | null = null

  constructor() {
    // accessToken은 initialize에서 설정됩니다
  }

  async initialize(userEmail: string, accessToken: string): Promise<void> {
    console.log('Initializing GoogleFormsClient for:', userEmail)
    this.userEmail = userEmail
    this.accessToken = accessToken
    
    if (!this.accessToken) {
      throw new Error('Google Forms API 접근을 위한 토큰을 찾을 수 없습니다.')
    }
  }

  private getAuth() {
    if (!this.accessToken) {
      throw new Error('Google Forms 클라이언트가 초기화되지 않았습니다.')
    }

    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({
      access_token: this.accessToken
    })

    return oauth2Client
  }

  async createForm(formData: CreateFormRequest): Promise<string> {
    console.log('Creating Google Form:', formData.title)
    
    try {
      const auth = this.getAuth()
      const forms = google.forms({ version: 'v1', auth })

      // 1. 빈 폼 생성
      console.log('Step 1: Creating empty form')
      const createResponse = await forms.forms.create({
        requestBody: {
          info: {
            title: formData.title,
            description: formData.description
          }
        }
      })

      const formId = createResponse.data.formId
      if (!formId) {
        throw new Error('폼 ID를 받을 수 없습니다.')
      }

      console.log('Form created with ID:', formId)

      // 2. 질문 추가
      console.log('Step 2: Adding questions to form')
      const requests = formData.questions.map((q, index) => {
        let questionItem: any = {
          createItem: {
            item: {
              title: q.question,
              questionItem: {}
            },
            location: {
              index: index
            }
          }
        }

        // 질문 타입별 설정
        switch (q.type) {
          case 'multiple_choice':
            if (q.options && q.options.length > 0) {
              questionItem.createItem.item.questionItem = {
                question: {
                  required: true,
                  choiceQuestion: {
                    type: 'RADIO',
                    options: q.options.map(option => ({ value: option }))
                  }
                }
              }
            } else {
              // 기본 5점 척도
              questionItem.createItem.item.questionItem = {
                question: {
                  required: true,
                  scaleQuestion: {
                    low: 1,
                    high: 5,
                    lowLabel: '전혀 아니다',
                    highLabel: '매우 그렇다'
                  }
                }
              }
            }
            break

          case 'linear_scale':
            questionItem.createItem.item.questionItem = {
              question: {
                required: true,
                scaleQuestion: {
                  low: 1,
                  high: 5,
                  lowLabel: '전혀 아니다',
                  highLabel: '매우 그렇다'
                }
              }
            }
            break

          case 'short_answer':
            questionItem.createItem.item.questionItem = {
              question: {
                required: false,
                textQuestion: {
                  paragraph: false
                }
              }
            }
            break

          case 'paragraph':
            questionItem.createItem.item.questionItem = {
              question: {
                required: false,
                textQuestion: {
                  paragraph: true
                }
              }
            }
            break

          default:
            // 기본적으로 5점 척도 사용
            questionItem.createItem.item.questionItem = {
              question: {
                required: true,
                scaleQuestion: {
                  low: 1,
                  high: 5,
                  lowLabel: '전혀 아니다',
                  highLabel: '매우 그렇다'
                }
              }
            }
        }

        return questionItem
      })

      // 배치 업데이트로 모든 질문 추가
      if (requests.length > 0) {
        console.log('Adding', requests.length, 'questions to form')
        await forms.forms.batchUpdate({
          formId: formId,
          requestBody: {
            requests: requests
          }
        })
      }

      // 3. 폼 URL 생성 및 반환
      const formUrl = `https://docs.google.com/forms/d/${formId}/edit`
      console.log('Form created successfully:', formUrl)

      return formUrl

    } catch (error) {
      console.error('Google Forms creation error:', error)
      
      if (error instanceof Error) {
        if (error.message.includes('403') || error.message.includes('Forbidden')) {
          throw new Error('Google Forms API 권한이 없습니다. Google Cloud Console에서 Forms API를 활성화해주세요.')
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          throw new Error('Google Forms API 인증에 실패했습니다. 다시 로그인해주세요.')
        } else if (error.message.includes('404')) {
          throw new Error('요청한 리소스를 찾을 수 없습니다.')
        } else if (error.message.includes('429')) {
          throw new Error('API 요청 제한에 도달했습니다. 잠시 후 다시 시도해주세요.')
        } else if (error.message.includes('quota')) {
          throw new Error('Google Forms API 할당량을 초과했습니다.')
        } else {
          throw new Error(`Google Forms 생성 실패: ${error.message}`)
        }
      }
      
      throw new Error('Google Forms 생성 중 알 수 없는 오류가 발생했습니다.')
    }
  }

  // 폼 응답 수집 설정
  async setupResponseCollection(formId: string, spreadsheetTitle?: string): Promise<string> {
    try {
      const auth = this.getAuth()
      const forms = google.forms({ version: 'v1', auth })

      // 응답 수집을 위한 스프레드시트 연결
      const response = await forms.forms.create({
        requestBody: {
          info: {
            title: spreadsheetTitle || '설문 응답 결과'
          }
        }
      })

      return response.data.responderUri || ''

    } catch (error) {
      console.error('Response collection setup error:', error)
      throw new Error('응답 수집 설정에 실패했습니다.')
    }
  }
}