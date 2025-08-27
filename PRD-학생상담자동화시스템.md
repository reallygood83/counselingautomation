# 📋 학생 상담 자동화 시스템 PRD (Product Requirements Document)

## 📊 프로젝트 개요

**프로젝트명**: AI 기반 학생 상담 자동화 시스템  
**버전**: v2.0  
**작성일**: 2025년 8월 27일  
**작성자**: Claude (Anthropic) + 김문정 (안양 박달초)  

### 🎯 프로젝트 목표
- SEL(Social-Emotional Learning) 기반 학생 상담 프로세스 완전 자동화
- Google Forms ↔ AI 분석 ↔ Google Sheets 완전 연동 시스템 구축
- 교사의 상담 업무 효율성 300% 향상
- 데이터 기반 과학적 상담 의사결정 지원

---

## 🔄 전체 시스템 워크플로우

### 📋 **Phase 1: 설문 생성 & 배포** ✅ (구현완료)
```
교사 로그인 → 학급/학생 설정 → AI 설문 생성 → Google Forms 배포
```

### 📝 **Phase 2: 학생 응답 수집** 🔄 (50% 구현)
```
학생 Forms 접속 → 신원 입력 → SEL 설문 응답 → 자동 수집
```

### 🤖 **Phase 3: AI 분석 & 저장** ✅ (구현완료)  
```
응답 데이터 수집 → Gemini AI 분석 → SEL 점수 계산 → Sheets 저장
```

### 📊 **Phase 4: 결과 시각화 & 상담** ✅ (구현완료)
```
SEL 차트 생성 → 위기 수준 판정 → 상담 인사이트 → 학부모 보고서
```

---

## 🏗️ 현재 구현 상태 분석

### ✅ **완료된 기능들**
1. **AI 설문 생성**: Gemini API 연동, 20문항 자동 생성
2. **Google Forms 연동**: 자동 Forms 생성 및 배포
3. **SEL 분석 엔진**: 5개 영역별 점수 계산 및 AI 인사이트
4. **Google Sheets 저장**: 분석 결과 자동 저장
5. **SEL 시각화**: Radar 차트 및 위기 수준 표시
6. **Firebase 연동**: 설문 데이터 영구 저장
7. **NextAuth 인증**: Google OAuth 인증 시스템

### 🔄 **부분 구현 상태**
1. **Forms 응답 수집**: API 구조는 있으나 실제 연동 필요
2. **학생 신원 확인**: Forms에 학생 정보 필드 자동 추가 필요

### ❌ **미구현 기능들**
1. **학생 목록 관리**: 학급별 학생 명단 관리 시스템
2. **응답 데이터 매핑**: Forms 응답과 학생 정보 연결
3. **대시보드 UI**: 교사용 종합 관리 인터페이스
4. **학부모 보고서**: PDF 자동 생성 및 발송

---

## 🔧 구현 계획: 누락된 핵심 기능들

### 1️⃣ **학생 목록 관리 시스템** (우선순위: 🔥 최고)

#### **요구사항**
- 교사가 학급별 학생 명단을 쉽게 등록/관리
- 학번, 이름, 학급 정보 체계적 관리
- CSV 파일 업로드로 대량 등록 지원

#### **구현 방안**
```typescript
// 새로운 API 엔드포인트
/api/students/register    // 학생 등록
/api/students/list        // 학생 목록 조회
/api/students/import      // CSV 파일 업로드
```

#### **데이터 구조**
```typescript
interface Student {
  id: string
  studentNumber: string  // 학번
  name: string          // 이름
  grade: string         // 학년
  class: string         // 반
  teacherEmail: string  // 담당 교사
  createdAt: Date
}
```

#### **Firebase Collections**
```
students/
├── {studentId}/
│   ├── studentNumber: "20241001"
│   ├── name: "김철수"  
│   ├── grade: "3학년"
│   ├── class: "3-1"
│   └── teacherEmail: "teacher@school.kr"
```

---

### 2️⃣ **Forms 응답 데이터 수집 시스템** (우선순위: 🔥 최고)

#### **현재 문제점**
- Google Forms 응답 데이터를 자동으로 가져오는 기능 없음
- 응답과 학생 정보 매핑 시스템 부재

#### **해결방안**

##### **A. Forms에 학생 신원 필드 자동 추가**
```typescript
// /lib/googleForms.ts 수정
async createFormWithStudentFields(formData, students) {
  // 1단계: 기본 Form 생성
  const form = await this.createForm(formData)
  
  // 2단계: 학생 신원 확인 필드 추가
  await forms.forms.batchUpdate({
    formId: form.formId,
    requestBody: {
      requests: [{
        createItem: {
          item: {
            title: "학생 정보",
            questionItem: {
              question: {
                required: true,
                choiceQuestion: {
                  type: "DROP_DOWN",
                  options: students.map(s => ({
                    value: `${s.studentNumber}-${s.name}`
                  }))
                }
              }
            }
          },
          location: { index: 0 } // 첫 번째 질문으로 배치
        }
      }]
    }
  })
}
```

##### **B. Forms 응답 자동 수집 API**
```typescript
// /api/forms/responses/[formId]/route.ts (신규)
export async function GET(request: NextRequest, { params }: { params: { formId: string } }) {
  const session = await getServerSession(authOptions)
  const { formId } = params
  
  // Google Forms API로 응답 데이터 수집
  const forms = google.forms({ version: 'v1', auth: oauth2Client })
  const responses = await forms.forms.responses.list({
    formId: formId
  })
  
  // 응답 데이터 파싱 및 학생 매핑
  const processedResponses = await this.processFormResponses(responses.data.responses)
  
  return NextResponse.json({ responses: processedResponses })
}

private async processFormResponses(responses: any[]) {
  return responses.map(response => {
    const answers = response.answers
    const studentInfo = this.extractStudentInfo(answers)
    const selAnswers = this.extractSelAnswers(answers)
    
    return {
      responseId: response.responseId,
      studentNumber: studentInfo.studentNumber,
      studentName: studentInfo.name,
      submittedAt: response.lastSubmittedTime,
      selAnswers: selAnswers
    }
  })
}
```

---

### 3️⃣ **응답 분석 자동화 시스템** (우선순위: 🔥 높음)

#### **요구사항**
- Forms 응답 수집 → AI 분석 → Sheets 저장까지 완전 자동화
- 실시간 응답 모니터링 및 즉시 분석

#### **구현 방안**
```typescript
// /api/surveys/auto-analyze/[surveyId]/route.ts (신규)
export async function POST(request: NextRequest, { params }: { params: { surveyId: string } }) {
  const { surveyId } = params
  
  // 1단계: 설문 정보 및 연결된 Forms ID 조회
  const survey = await getSurveyById(surveyId)
  
  // 2단계: Forms 응답 데이터 수집  
  const responses = await this.collectFormResponses(survey.formsId)
  
  // 3단계: 각 학생별 응답 AI 분석
  const analysisResults = []
  for (const response of responses) {
    const analysis = await geminiClient.analyzeSelResponses(
      response.selAnswers, 
      survey.questions
    )
    analysisResults.push({
      studentNumber: response.studentNumber,
      studentName: response.studentName,
      ...analysis
    })
  }
  
  // 4단계: Google Sheets에 분석 결과 저장
  await this.saveAnalysisToSheets(survey.spreadsheetId, analysisResults)
  
  return NextResponse.json({ 
    success: true, 
    analyzedCount: analysisResults.length,
    results: analysisResults 
  })
}
```

---

### 4️⃣ **교사 대시보드 UI** (우선순위: 🟡 중간)

#### **요구사항**
- 한눈에 보는 학급 전체 SEL 현황
- 위기 학생 즉시 식별 및 알림
- 개별 학생 상세 분석 및 상담 이력

#### **UI 컴포넌트 설계**
```typescript
// /app/dashboard/page.tsx (신규)
export default function TeacherDashboard() {
  return (
    <div className="dashboard-layout">
      {/* 학급 개요 */}
      <ClassOverview 
        totalStudents={32}
        surveyCompleted={28}
        crisisAlerts={3}
      />
      
      {/* 위기 학생 알림 */}
      <CrisisAlert students={crisisStudents} />
      
      {/* SEL 분포 차트 */}
      <ClassSELDistribution data={classSelData} />
      
      {/* 개별 학생 카드 */}
      <StudentGrid students={students} />
    </div>
  )
}
```

---

### 5️⃣ **학부모 보고서 자동 생성** (우선순위: 🟡 중간)

#### **요구사항**
- 개별 학생 SEL 분석 PDF 보고서 자동 생성
- 학부모 친화적 설명과 가정 지도 방안 포함

#### **구현 방안**
```typescript
// /api/reports/generate/[studentId]/route.ts (신규)
export async function GET(request: NextRequest, { params }) {
  const student = await getStudentById(params.studentId)
  const latestAnalysis = await getLatestSelAnalysis(student.id)
  
  // PDF 보고서 생성
  const pdfBuffer = await generateStudentReport({
    student,
    analysis: latestAnalysis,
    template: 'parent-friendly'
  })
  
  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="SEL분석보고서_${student.name}.pdf"`
    }
  })
}
```

---

## 📊 데이터 아키텍처

### **Firebase Collections**
```
users/                    # 교사 계정 정보
├── {userId}/
    ├── email: "teacher@school.kr"  
    ├── name: "김선생님"
    └── schoolInfo: {...}

students/                 # 학생 명단
├── {studentId}/
    ├── studentNumber: "20241001"
    ├── name: "김철수"
    ├── teacherEmail: "teacher@school.kr"
    └── classInfo: {...}

surveys/                  # 설문 정보  
├── {surveyId}/
    ├── title: "3학년 SEL 설문"
    ├── formsId: "google-forms-id"
    ├── spreadsheetId: "google-sheets-id"
    ├── questions: [...]
    └── status: "active"

responses/                # 응답 데이터
├── {responseId}/
    ├── surveyId: "survey-123"
    ├── studentId: "student-456" 
    ├── answers: {...}
    └── submittedAt: "2025-08-27"

analyses/                 # 분석 결과
├── {analysisId}/
    ├── studentId: "student-456"
    ├── surveyId: "survey-123"
    ├── selScores: {...}
    ├── insights: "..."
    └── analyzedAt: "2025-08-27"
```

---

## 🚀 개발 우선순위 & 일정

### **Sprint 1: 핵심 인프라 구축** (1주)
1. ✅ Google OAuth 설정 완료
2. 🔄 학생 관리 시스템 구축
3. 🔄 Forms 응답 수집 API 개발
4. 🔄 응답-학생 매핑 시스템

### **Sprint 2: 자동화 완성** (1주)  
1. 🔄 Forms에 학생 필드 자동 추가
2. 🔄 응답 수집 → 분석 → 저장 자동화
3. 🔄 실시간 분석 트리거 구현
4. 🔄 오류 처리 및 복구 시스템

### **Sprint 3: UI/UX 완성** (1주)
1. 🔄 교사 대시보드 구축
2. 🔄 학생 관리 인터페이스
3. 🔄 분석 결과 시각화 고도화
4. 🔄 모바일 친화적 UI 최적화

### **Sprint 4: 고급 기능** (1주)
1. 🔄 학부모 보고서 자동 생성
2. 🔄 위기 학생 자동 알림
3. 🔄 데이터 백업 및 보안 강화
4. 🔄 성능 최적화

---

## 🔧 기술적 구현 세부사항

### **Google Forms API 활용**
```javascript
// Forms 생성 시 학생 선택 필드 자동 추가
const studentDropdownItem = {
  title: "학생 정보를 선택하세요",
  questionItem: {
    question: {
      required: true,
      choiceQuestion: {
        type: "DROP_DOWN",
        options: students.map(student => ({
          value: `${student.studentNumber}|${student.name}`
        }))
      }
    }
  }
}
```

### **응답 데이터 파싱**
```typescript
function parseFormResponse(response: any): StudentResponse {
  const answers = response.answers
  
  // 첫 번째 답변에서 학생 정보 추출
  const studentInfo = answers[Object.keys(answers)[0]]
  const [studentNumber, name] = studentInfo.textAnswers.answers[0].value.split('|')
  
  // 나머지 답변에서 SEL 점수 추출
  const selAnswers = Object.keys(answers).slice(1).reduce((acc, questionId) => {
    const questionIndex = parseInt(questionId.replace('question_', ''))
    acc[`q${questionIndex - 1}`] = parseInt(answers[questionId].textAnswers.answers[0].value)
    return acc
  }, {})
  
  return { studentNumber, name, selAnswers }
}
```

### **실시간 분석 트리거**
```typescript
// Webhook 또는 polling 방식으로 새 응답 감지
setInterval(async () => {
  const activeSurveys = await getActiveSurveys()
  
  for (const survey of activeSurveys) {
    const newResponses = await checkNewResponses(survey.formsId)
    
    if (newResponses.length > 0) {
      await triggerAutoAnalysis(survey.id, newResponses)
    }
  }
}, 60000) // 1분마다 체크
```

---

## 📈 성공 지표 (KPIs)

### **효율성 지표**
- 설문 생성 시간: 30분 → 3분 (90% 단축)
- 분석 처리 시간: 2시간 → 5분 (95% 단축)  
- 보고서 작성 시간: 1시간 → 자동생성 (100% 자동화)

### **정확성 지표**
- SEL 분석 정확도: >95% (AI 기반)
- 데이터 무결성: 100% (자동 검증)
- 위기 학생 식별률: >98%

### **사용성 지표**
- 교사 만족도: >4.5/5.0
- 시스템 가용성: >99.9%
- 응답 완료율: >90%

---

## 🛡️ 보안 및 프라이버시

### **데이터 보안**
- Google OAuth 2.0 인증
- Firebase Security Rules 적용
- HTTPS 통신 강제
- 개인정보 암호화 저장

### **프라이버시 보호**
- 최소 필요 정보만 수집
- 데이터 보관 기간 제한 (3년)
- 학부모 동의 확인 프로세스
- GDPR 준수

---

## 🔮 향후 확장 계획

### **Phase 2: AI 고도화** (6개월 후)
- 개별 맞춤형 상담 제안
- 학급 전체 동향 예측
- 학부모-교사 소통 자동화

### **Phase 3: 통합 플랫폼** (1년 후)  
- 학교 전체 통계 대시보드
- 지역 교육청 연동
- 학생 성장 장기 추적

---

## ✅ 결론

이 PRD는 현재 50% 구현된 시스템을 완전 자동화하기 위한 구체적인 로드맵을 제시합니다. **가장 중요한 것은 Forms 응답 수집과 학생 관리 시스템**이며, 이 두 가지만 구현하면 완전한 자동화가 가능합니다.

핵심 기술적 도전 과제:
1. **Google Forms 응답 API 연동**
2. **학생 신원과 응답 데이터 매핑** 
3. **실시간 자동 분석 트리거**

이 시스템이 완성되면 교사는 단순히 "분석" 버튼 하나만 클릭하면 모든 학생의 SEL 분석이 자동으로 완료되는 혁신적인 상담 자동화 도구가 될 것입니다.

---

**문서 버전**: v1.0  
**최종 수정**: 2025년 8월 27일  
**다음 리뷰**: 2025년 9월 3일