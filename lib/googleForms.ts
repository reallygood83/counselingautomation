import { google } from 'googleapis'

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
  includeStudentFields?: boolean // 학생 식별 필드 포함 여부
  classNames?: string[] // 학급 목록 (드롭다운용)
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

      // 1. 빈 폼 생성 (title만 설정)
      console.log('Step 1: Creating empty form with title only')
      const createResponse = await forms.forms.create({
        requestBody: {
          info: {
            title: formData.title
          }
        }
      })

      const formId = createResponse.data.formId
      if (!formId) {
        throw new Error('폼 ID를 받을 수 없습니다.')
      }

      console.log('Form created with ID:', formId)

      // 2. 폼 설명 업데이트
      console.log('Step 2: Adding description to form')
      const descriptionRequests = []
      if (formData.description) {
        descriptionRequests.push({
          updateFormInfo: {
            info: {
              description: formData.description
            },
            updateMask: 'description'
          }
        })
      }

      if (descriptionRequests.length > 0) {
        await forms.forms.batchUpdate({
          formId: formId,
          requestBody: {
            requests: descriptionRequests
          }
        })
        console.log('Description added successfully')
      }

      // 3. 학생 식별 필드 추가 (옵션)
      let questionStartIndex = 0
      const studentFieldRequests = []
      
      if (formData.includeStudentFields) {
        console.log('Step 3a: Adding student identification fields', {
          includeStudentFields: formData.includeStudentFields,
          classNamesProvided: formData.classNames?.length || 0
        })
        
        // 학생명 필드
        const studentNameField = {
          createItem: {
            item: {
              title: '학생명',
              description: '본인의 이름을 정확히 입력해주세요.',
              questionItem: {
                question: {
                  required: true,
                  textQuestion: {
                    paragraph: false
                  }
                }
              }
            },
            location: { index: 0 }
          }
        }
        studentFieldRequests.push(studentNameField)
        console.log('Added student name field:', JSON.stringify(studentNameField, null, 2))

        // 학급 선택 필드 (학급 목록이 제공된 경우 드롭다운, 아니면 텍스트)
        let classField
        if (formData.classNames && formData.classNames.length > 0) {
          classField = {
            createItem: {
              item: {
                title: '학급',
                description: '본인이 속한 학급을 선택해주세요.',
                questionItem: {
                  question: {
                    required: true,
                    choiceQuestion: {
                      type: 'DROP_DOWN',
                      options: formData.classNames.map(className => ({ value: className }))
                    }
                  }
                }
              },
              location: { index: 1 }
            }
          }
          console.log('Added class dropdown field with options:', formData.classNames)
        } else {
          classField = {
            createItem: {
              item: {
                title: '학급',
                description: '본인이 속한 학급을 입력해주세요 (예: 3-1, 4-2).',
                questionItem: {
                  question: {
                    required: true,
                    textQuestion: {
                      paragraph: false
                    }
                  }
                }
              },
              location: { index: 1 }
            }
          }
          console.log('Added class text field (no options provided)')
        }
        studentFieldRequests.push(classField)

        // 학번 필드
        const studentNumberField = {
          createItem: {
            item: {
              title: '학번 (번호)',
              description: '본인의 번호를 입력해주세요 (예: 15)',
              questionItem: {
                question: {
                  required: true,
                  textQuestion: {
                    paragraph: false
                  }
                }
              }
            },
            location: { index: 2 }
          }
        }
        studentFieldRequests.push(studentNumberField)
        console.log('Added student number field:', JSON.stringify(studentNumberField, null, 2))

        questionStartIndex = 3 // 학생 필드 다음부터 설문 질문 시작
      }

      // 학생 필드 먼저 추가
      if (studentFieldRequests.length > 0) {
        console.log('Step 3b: Executing batchUpdate for student fields', {
          requestsCount: studentFieldRequests.length,
          formId: formId,
          requests: JSON.stringify(studentFieldRequests, null, 2)
        })
        
        try {
          const batchUpdateResult = await forms.forms.batchUpdate({
            formId: formId,
            requestBody: {
              requests: studentFieldRequests
            }
          })
          
          console.log('Student fields batchUpdate result:', {
            status: 'success',
            resultData: batchUpdateResult.data,
            formId: formId
          })
          
        } catch (batchError) {
          console.error('Student fields batchUpdate failed:', {
            error: batchError,
            message: batchError instanceof Error ? batchError.message : 'Unknown error',
            formId: formId,
            requests: studentFieldRequests
          })
          throw new Error(`학생 식별 필드 추가 실패: ${batchError instanceof Error ? batchError.message : 'Unknown error'}`)
        }
      }

      // 4. 설문 질문 추가
      console.log('Step 4: Adding survey questions to form')
      const requests = formData.questions.map((q, index) => {
        let questionItem: any = {
          createItem: {
            item: {
              title: q.question,
              questionItem: {}
            },
            location: {
              index: index + questionStartIndex
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
        console.log('Step 5: Adding survey questions to form', {
          questionsCount: requests.length,
          questionStartIndex: questionStartIndex
        })
        
        try {
          const questionsResult = await forms.forms.batchUpdate({
            formId: formId,
            requestBody: {
              requests: requests
            }
          })
          
          console.log('Survey questions added successfully:', {
            questionsCount: requests.length,
            resultData: questionsResult.data
          })
          
        } catch (questionsError) {
          console.error('Survey questions batchUpdate failed:', {
            error: questionsError,
            message: questionsError instanceof Error ? questionsError.message : 'Unknown error',
            formId: formId,
            questionsCount: requests.length
          })
          throw new Error(`설문 질문 추가 실패: ${questionsError instanceof Error ? questionsError.message : 'Unknown error'}`)
        }
      }

      // 5. 폼 URL 생성 및 반환
      const editUrl = `https://docs.google.com/forms/d/${formId}/edit`
      const responseUrl = `https://docs.google.com/forms/d/${formId}/viewform`
      
      console.log('Form created successfully:', {
        formId: formId,
        editUrl: editUrl,
        responseUrl: responseUrl,
        includeStudentFields: formData.includeStudentFields,
        studentFieldsAdded: studentFieldRequests.length > 0 ? 3 : 0
      })

      return editUrl

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