import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { google } from 'googleapis'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'

interface Student {
  id: string
  studentName: string
  studentNumber: number
  className: string
  schoolName: string
  teacherEmail: string
  teacherName: string
  registeredAt: any
  status: string
  surveyCount: number
  lastSurveyAt?: any
  notes: string
  matchType?: string
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || !session.accessToken) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const formId = searchParams.get('formId')
    
    console.log('Forms API 호출:', { url: request.url, formId })
    
    if (!formId || formId.length < 10) {
      console.log('유효하지 않은 formId:', formId)
      return NextResponse.json(
        { error: '유효한 Google Forms ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // Google Forms API를 통한 응답 수집
    const oauth2Client = new google.auth.OAuth2()
    oauth2Client.setCredentials({
      access_token: session.accessToken
    })

    const forms = google.forms({ version: 'v1', auth: oauth2Client })

    // 폼 정보 가져오기
    const formResponse = await forms.forms.get({
      formId: formId
    })

    // 응답 목록 가져오기
    const responsesResponse = await forms.forms.responses.list({
      formId: formId
    })

    const responses = responsesResponse.data.responses || []
    const formInfo = formResponse.data

    console.log(`Forms 응답 수집: ${responses.length}개의 응답을 찾았습니다.`)

    // 응답 데이터 파싱 및 학생 매칭
    const processedResponses = []
    const unmatchedResponses = []

    for (const response of responses) {
      try {
        console.log('📥 원시 Forms 응답 데이터:', {
          responseId: response.responseId,
          hasAnswers: !!response.answers,
          answersKeys: response.answers ? Object.keys(response.answers) : 'no answers',
          fullResponseStructure: JSON.stringify(response, null, 2),
          formInfoStructure: formInfo?.items ? `Found ${formInfo.items.length} form items` : 'No form items'
        })
        
        const responseData = parseFormsResponse(response, formInfo)
        
        // 학생 정보 추출 (Forms의 첫 3개 질문이 학생 식별 필드라고 가정)
        const studentInfo = extractStudentInfo(responseData)
        
        console.log('🔍 Forms 응답 데이터 디버깅:', {
          responseId: response.responseId,
          extractedStudentInfo: studentInfo,
          rawAnswers: responseData.answers,
          answersCount: Object.keys(responseData.answers).length,
          formInfo: formInfo ? 'present' : 'missing'
        })
        
        // 등록된 학생과 매칭
        const matchedStudent = await findMatchingStudent(
          session.user.email,
          studentInfo.studentName,
          studentInfo.className,
          studentInfo.studentNumber
        )
        
        console.log('👥 학생 매칭 결과:', {
          extractedInfo: studentInfo,
          matchedStudent: matchedStudent ? {
            id: matchedStudent.id,
            name: matchedStudent.studentName,
            class: matchedStudent.className,
            number: matchedStudent.studentNumber
          } : null
        })

        if (matchedStudent) {
          processedResponses.push({
            responseId: response.responseId,
            formId: formId,
            studentId: matchedStudent.id,
            studentName: matchedStudent.studentName,
            className: matchedStudent.className,
            studentNumber: matchedStudent.studentNumber,
            submittedAt: response.lastSubmittedTime,
            answers: responseData.answers,
            selScores: null, // 분석 후 계산됨
            processed: false
          })
        } else {
          unmatchedResponses.push({
            responseId: response.responseId,
            studentInfo,
            submittedAt: response.lastSubmittedTime,
            reason: '등록된 학생 정보와 일치하지 않습니다.'
          })
        }

      } catch (error) {
        console.error(`응답 처리 오류 (${response.responseId}):`, error)
        unmatchedResponses.push({
          responseId: response.responseId,
          submittedAt: response.lastSubmittedTime,
          reason: `응답 처리 중 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
        })
      }
    }

    return NextResponse.json({
      success: true,
      formId,
      formTitle: formInfo?.info?.title || 'Unknown Form',
      totalResponses: responses.length,
      processedResponses: processedResponses.length,
      unmatchedResponses: unmatchedResponses.length,
      responses: processedResponses,
      unmatchedData: unmatchedResponses
    })

  } catch (error) {
    console.error('Forms 응답 수집 오류:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('403') || error.message.includes('Forbidden')) {
        return NextResponse.json(
          { error: 'Google Forms API 권한이 없습니다.' },
          { status: 403 }
        )
      } else if (error.message.includes('404')) {
        return NextResponse.json(
          { error: '해당 폼을 찾을 수 없습니다.' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Forms 응답 수집 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// Forms 응답을 파싱하여 구조화된 데이터로 변환
function parseFormsResponse(response: any, formInfo: any) {
  console.log('🔧 parseFormsResponse 디버깅:', {
    hasResponseAnswers: !!response.answers,
    responseAnswersKeys: response.answers ? Object.keys(response.answers) : 'no answers',
    hasFormInfo: !!formInfo,
    formInfoItems: formInfo?.items ? formInfo.items.length : 'no items',
    formItems: formInfo?.items ? formInfo.items.map((item: any) => ({
      itemId: item.itemId,
      title: item.title,
      questionType: item.questionItem ? getQuestionType(item.questionItem.question) : 'no question'
    })) : 'no items to map'
  })
  
  const answers: Record<string, any> = {}
  
  if (response.answers) {
    Object.keys(response.answers).forEach(questionId => {
      const answer = response.answers[questionId]
      const question = findQuestionById(formInfo, questionId)
      
      // 질문에서 제목 추출 (여러 경로 시도)
      const questionTitle = question?.title || 
                           question?.questionTitle ||
                           question?.question?.title ||
                           findQuestionTitleById(formInfo, questionId) ||
                           'not found'
      
      console.log('🔍 질문 처리:', {
        questionId,
        hasAnswer: !!answer,
        foundQuestion: !!question,
        questionTitle: questionTitle,
        questionDebug: {
          directTitle: question?.title,
          questionTitleProp: question?.questionTitle,
          nestedTitle: question?.question?.title,
          fromFormInfo: findQuestionTitleById(formInfo, questionId)
        }
      })
      
      if (question) {
        answers[questionId] = {
          questionTitle: questionTitle,
          questionType: getQuestionType(question),
          answer: extractAnswerValue(answer)
        }
      }
    })
  }

  return {
    responseId: response.responseId,
    submittedAt: response.lastSubmittedTime,
    answers
  }
}

// 응답에서 학생 정보 추출 (제목 기반으로 찾기)
function extractStudentInfo(responseData: any) {
  console.log('🔍 extractStudentInfo 디버깅:', {
    answersCount: Object.keys(responseData.answers).length,
    answersEntries: Object.entries(responseData.answers).map(([id, data]: [string, any]) => ({
      questionId: id,
      questionTitle: data.questionTitle,
      answer: data.answer
    }))
  })
  
  let studentName = ''
  let className = ''  
  let studentNumber = 0
  
  // 답변들을 순회하면서 학생 정보 찾기
  for (const [questionId, answerData] of Object.entries(responseData.answers)) {
    const data = answerData as any
    const title = data.questionTitle || ''
    const answer = data.answer || ''
    
    console.log('🔎 답변 분석:', {
      questionId,
      title,
      answer,
      titleCheck: {
        isStudentName: title.includes('학생명') || title.includes('이름'),
        isClassName: title.includes('학급') || title.includes('반'),
        isStudentNumber: title.includes('학번') || title.includes('번호')
      }
    })
    
    if (title.includes('학생명') || title.includes('이름')) {
      studentName = answer.toString()
    } else if (title.includes('학급') || title.includes('반')) {
      className = answer.toString()
    } else if (title.includes('학번') || title.includes('번호')) {
      studentNumber = parseInt(answer) || 0
    }
  }
  
  console.log('📋 최종 추출된 학생 정보:', {
    studentName,
    className,
    studentNumber
  })
  
  return {
    studentName,
    className,
    studentNumber
  }
}

// 등록된 학생과 매칭
async function findMatchingStudent(
  teacherEmail: string, 
  studentName: string, 
  className: string, 
  studentNumber: number
): Promise<Student | null> {
  try {
    const studentsQuery = query(
      collection(db, 'students'),
      where('teacherEmail', '==', teacherEmail),
      where('studentName', '==', studentName.trim()),
      where('className', '==', className.trim())
    )

    const snapshot = await getDocs(studentsQuery)
    
    // 정확한 매칭 (이름, 학급, 학번 모두 일치)
    for (const doc of snapshot.docs) {
      const student = doc.data()
      if (student.studentNumber === studentNumber) {
        return {
          id: doc.id,
          ...student
        } as Student
      }
    }

    // 이름과 학급만 일치하는 경우 (학번 불일치)
    if (!snapshot.empty) {
      const student = snapshot.docs[0].data()
      return {
        id: snapshot.docs[0].id,
        ...student,
        matchType: 'partial' // 부분 매칭 표시
      } as Student
    }

    return null

  } catch (error) {
    console.error('학생 매칭 오류:', error)
    return null
  }
}

// 폼에서 질문 ID로 질문 찾기
function findQuestionById(formInfo: any, questionId: string) {
  if (!formInfo?.items) return null
  
  // 먼저 itemId로 찾기
  let foundItem = formInfo.items.find((item: any) => 
    item.questionItem && item.itemId === questionId
  )
  
  // itemId로 찾지 못하면 questionItem.question.questionId로 찾기  
  if (!foundItem) {
    foundItem = formInfo.items.find((item: any) => 
      item.questionItem && item.questionItem.question && item.questionItem.question.questionId === questionId
    )
  }
  
  console.log('🔎 findQuestionById 결과:', {
    searchingFor: questionId,
    found: !!foundItem,
    itemId: foundItem?.itemId,
    title: foundItem?.title || foundItem?.questionItem?.question?.title,
    hasQuestionItem: !!foundItem?.questionItem
  })
  
  return foundItem?.questionItem?.question || foundItem?.questionItem || foundItem
}

// 질문 ID로 질문 제목 직접 찾기
function findQuestionTitleById(formInfo: any, questionId: string): string | null {
  if (!formInfo?.items) return null
  
  // formInfo.items에서 직접 title 찾기
  for (const item of formInfo.items) {
    // itemId 매칭 시도
    if (item.itemId === questionId && item.title) {
      console.log('🎯 제목 찾기 성공 (itemId):', {
        questionId,
        title: item.title,
        method: 'itemId_match'
      })
      return item.title
    }
    
    // questionItem.question.questionId 매칭 시도
    if (item.questionItem && item.questionItem.question && 
        item.questionItem.question.questionId === questionId && item.title) {
      console.log('🎯 제목 찾기 성공 (questionId):', {
        questionId,
        title: item.title,
        method: 'questionId_match'
      })
      return item.title
    }
  }
  
  console.log('❌ 제목 찾기 실패:', {
    questionId,
    availableItems: formInfo.items.map((item: any) => ({
      itemId: item.itemId,
      title: item.title,
      hasQuestionItem: !!item.questionItem,
      questionId: item.questionItem?.question?.questionId
    }))
  })
  
  return null
}

// 질문 타입 추출
function getQuestionType(question: any) {
  if (question.choiceQuestion) return 'choice'
  if (question.textQuestion) return 'text'
  if (question.scaleQuestion) return 'scale'
  return 'unknown'
}

// 응답 값 추출
function extractAnswerValue(answer: any) {
  if (answer.textAnswers) {
    return answer.textAnswers.answers?.[0]?.value || ''
  }
  
  if (answer.fileUploadAnswers) {
    return answer.fileUploadAnswers.answers || []
  }
  
  if (answer.choiceAnswers) {
    return answer.choiceAnswers.answers || []
  }

  return answer
}

// Forms 응답을 Firebase에 저장
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { responses, formId, surveyId } = body

    if (!responses || !Array.isArray(responses)) {
      return NextResponse.json(
        { error: '저장할 응답 데이터가 필요합니다.' },
        { status: 400 }
      )
    }

    const savedResponses = []

    // 각 응답을 Firebase에 저장
    for (const response of responses) {
      const responseDoc = {
        ...response,
        formId,
        surveyId: surveyId || null,
        teacherEmail: session.user.email,
        savedAt: serverTimestamp(),
        processed: false
      }

      const docRef = await addDoc(collection(db, 'surveyResponses'), responseDoc)
      savedResponses.push({
        id: docRef.id,
        responseId: response.responseId
      })
    }

    return NextResponse.json({
      success: true,
      saved: savedResponses.length,
      responses: savedResponses,
      message: `${savedResponses.length}개의 응답이 저장되었습니다.`
    })

  } catch (error) {
    console.error('응답 저장 오류:', error)
    return NextResponse.json(
      { error: '응답 저장 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}