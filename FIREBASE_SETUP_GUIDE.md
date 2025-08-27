# Firebase 설정 가이드

## 🔥 Firebase 프로젝트 설정

### 1단계: Firebase 프로젝트 생성
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름: `mira-counseling-system` 
4. Google Analytics 사용 설정 (선택사항)
5. 프로젝트 생성 완료

### 2단계: Firestore Database 설정
1. 좌측 메뉴에서 "Firestore Database" 클릭
2. "데이터베이스 만들기" 버튼 클릭
3. **테스트 모드**로 시작 선택 (나중에 보안 규칙 설정)
4. Cloud Firestore 위치: `asia-northeast3 (Seoul)` 선택
5. 완료 클릭

### 3단계: 웹 앱 등록
1. 프로젝트 개요 페이지에서 웹 아이콘(`</>`) 클릭
2. 앱 닉네임: `MIRA 상담 시스템` 입력
3. Firebase Hosting 설정하기 체크 (선택사항)
4. "앱 등록" 클릭

### 4단계: 설정 키 복사
Firebase 설정 객체가 표시되면 다음 값들을 복사:

```javascript
const firebaseConfig = {
  apiKey: "AIza...복사할값",
  authDomain: "mira-counseling-system.firebaseapp.com",
  projectId: "mira-counseling-system",
  storageBucket: "mira-counseling-system.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123:web:abc123"
};
```

### 5단계: 환경변수 설정
`.env.local` 파일의 Firebase 섹션을 실제 값으로 교체:

```env
# Firebase 설정 - 실제 값으로 교체하세요!
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...위에서_복사한_실제_값
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=mira-counseling-system.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=mira-counseling-system
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=mira-counseling-system.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc123
```

## 📊 필요한 Firestore 컬렉션

시스템이 자동으로 생성할 컬렉션들:

### students 컬렉션
```javascript
{
  teacherEmail: "teacher@school.com",
  studentName: "김철수", 
  studentNumber: 15,
  className: "3-1",
  schoolName: "박달초등학교",
  status: "active",
  surveyCount: 0,
  registeredAt: timestamp,
  lastSurveyAt: timestamp (optional)
}
```

### responses 컬렉션  
```javascript
{
  teacherEmail: "teacher@school.com",
  surveyId: "form-id-from-google",
  studentId: "student-doc-id",
  studentName: "김철수",
  className: "3-1", 
  studentNumber: 15,
  answers: {...}, // Google Forms 응답 데이터
  selScores: {
    selfAwareness: 4.2,
    selfManagement: 3.8,
    socialAwareness: 4.0,
    relationship: 3.5,
    decisionMaking: 3.9
  },
  submittedAt: timestamp,
  processedAt: timestamp
}
```

## 🔒 보안 규칙 설정 (나중에)

개발 완료 후 Firestore 보안 규칙 적용:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 인증된 사용자만 자신의 데이터 접근 가능
    match /students/{document} {
      allow read, write: if request.auth != null 
        && resource.data.teacherEmail == request.auth.token.email;
    }
    
    match /responses/{document} {
      allow read, write: if request.auth != null 
        && resource.data.teacherEmail == request.auth.token.email;
    }
  }
}
```

## ✅ 설정 완료 확인

1. 개발 서버 재시작: `npm run dev`
2. 브라우저에서 콘솔 확인 - Firebase 연결 오류 없는지 체크
3. 학생 등록 테스트
4. Firebase Console에서 Firestore 데이터 확인

## 🚨 주의사항

- `.env.local` 파일은 절대 Git에 커밋하지 마세요
- 테스트 모드는 30일 후 자동으로 비활성화됩니다
- 실제 배포 시에는 보안 규칙을 반드시 설정하세요
- Firebase 프로젝트의 요금제 확인 (Spark 플랜은 무료)