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
    
    if (!formId) {
      return NextResponse.json(
        { error: '폼 ID가 필요합니다.' },
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
        const responseData = parseFormsResponse(response, formInfo)
        
        // 학생 정보 추출 (Forms의 첫 3개 질문이 학생 식별 필드라고 가정)
        const studentInfo = extractStudentInfo(responseData)
        
        // 등록된 학생과 매칭
        const matchedStudent = await findMatchingStudent(
          session.user.email,
          studentInfo.studentName,
          studentInfo.className,
          studentInfo.studentNumber
        )

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
  const answers: Record<string, any> = {}
  
  if (response.answers) {
    Object.keys(response.answers).forEach(questionId => {
      const answer = response.answers[questionId]
      const question = findQuestionById(formInfo, questionId)
      
      if (question) {
        answers[questionId] = {
          questionTitle: question.title,
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

// 응답에서 학생 정보 추출 (첫 3개 질문 가정)
function extractStudentInfo(responseData: any) {
  const answers = Object.values(responseData.answers) as any[]
  
  // 순서대로 학생명, 학급, 학번이라고 가정
  return {
    studentName: answers[0]?.answer || '',
    className: answers[1]?.answer || '',
    studentNumber: parseInt(answers[2]?.answer) || 0
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
  
  return formInfo.items.find((item: any) => 
    item.questionItem && item.itemId === questionId
  )?.questionItem?.question
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