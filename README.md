# 학생 상담 자동화 시스템

AI 기반 학생 상담 설문 생성 및 SEL(Social-Emotional Learning) 분석 도구

## 🎯 주요 기능

- **AI 설문 생성**: Gemini API를 활용한 맞춤형 상담 설문 자동 생성
- **SEL 분석**: 5개 영역 사회정서학습 분석 (자기인식, 자기관리, 사회인식, 관계기술, 의사결정)
- **Google 통합**: Google Forms, Sheets와 완벽 연동
- **직관적 UI**: 한국 교사를 위한 모바일 친화적 인터페이스
- **위기 알림**: 학생별 상황에 따른 단계별 위기 수준 표시

## 🚀 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 값들을 설정하세요:

```bash
# NextAuth 설정
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=secure-random-string

# Google OAuth 설정
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Gemini API 설정
GEMINI_API_KEY=your-gemini-api-key
```

### 3. Google OAuth 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. APIs & Services > Credentials로 이동
4. Create Credentials > OAuth client ID 선택
5. Application type을 "Web application"으로 설정
6. Authorized redirect URIs에 추가:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://yourdomain.com/api/auth/callback/google` (배포 시)

### 4. Gemini API 설정

1. [Google AI Studio](https://makersuite.google.com/app/apikey)에 접속
2. Create API Key 클릭
3. 생성된 API 키를 `.env.local`에 추가

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 을 열어 확인하세요.

## 📱 기술 스택

### Frontend
- **Next.js 14**: React 기반 풀스택 프레임워크
- **TypeScript**: 타입 안전성
- **Tailwind CSS**: 유틸리티 중심 CSS 프레임워크
- **Recharts**: SEL 분석 차트 라이브러리

### Backend & APIs
- **NextAuth.js**: Google OAuth 인증
- **Google APIs**: Forms, Sheets 연동
- **Gemini API**: AI 기반 설문 생성

### UI/UX
- **Pretendard**: 한국어 최적화 폰트
- **Responsive Design**: 모바일 우선 설계
- **SEL Color System**: 5영역별 색상 체계
- **Crisis Alert**: 단계별 위기 수준 표시

## 🎨 디자인 시스템

### 색상 팔레트
- **자기인식**: 파란색 (#3B82F6)
- **자기관리**: 초록색 (#10B981)
- **사회인식**: 주황색 (#F59E0B)
- **관계기술**: 보라색 (#8B5CF6)
- **의사결정**: 빨간색 (#EF4444)

### 위기 수준
- **정상**: 초록색 (#10B981) 😊
- **관심**: 주황색 (#F59E0B) 🤔
- **주의**: 빨간색 (#EF4444) ⚠️
- **위험**: 진한 빨간색 (#DC2626) 🚨

## 📊 SEL 분석 기준

### 5개 핵심 영역
1. **자기인식** (Self-Awareness): 자신의 감정, 생각, 가치관 인식
2. **자기관리** (Self-Management): 감정 조절, 스트레스 관리, 목표 달성
3. **사회인식** (Social Awareness): 타인 이해, 공감, 다양성 수용
4. **관계기술** (Relationship Skills): 소통, 협력, 갈등 해결
5. **의사결정** (Responsible Decision-Making): 문제 해결, 도덕적 판단

### 평가 척도
- **5점**: 매우 우수
- **4점**: 우수
- **3점**: 보통
- **2점**: 개선 필요
- **1점**: 집중 지원 필요

## 🔧 개발 가이드

### 프로젝트 구조

```
counseling-automation/
├── app/                    # Next.js 13+ App Router
│   ├── api/               # API 라우트
│   ├── dashboard/         # 대시보드 페이지
│   ├── surveys/           # 설문 관리
│   └── globals.css       # 전역 스타일
├── components/            # 재사용 컴포넌트
│   ├── ui/               # 기본 UI 컴포넌트
│   └── charts/           # 차트 컴포넌트
└── lib/                  # 유틸리티 함수
```

### 주요 컴포넌트

- **Button**: 다양한 variant와 size를 지원하는 버튼
- **StudentCard**: 학생 정보 및 SEL 점수 표시 카드
- **SELChart**: Radar 차트를 활용한 SEL 5영역 시각화
- **Card**: 일관된 디자인을 위한 카드 컨테이너

## 📚 사용 가이드

### 교사용 워크플로우
1. **Google 로그인**: 별도 설정 없이 Google 계정으로 즉시 시작
2. **학생 등록**: 학급별 학생 정보 등록
3. **설문 생성**: AI가 학생 상황에 맞는 설문 자동 생성
4. **결과 분석**: SEL 5영역별 상세 분석 및 시각화
5. **보고서 생성**: 학부모/학교용 종합 보고서 자동 생성

### 학생용 경험
1. **설문 링크 접속**: 교사가 공유한 Google Forms 링크
2. **간편 응답**: 모바일 친화적 설문 인터페이스
3. **실시간 피드백**: 응답 완료 즉시 결과 반영

## 🌟 특징

- **Zero Configuration**: 복잡한 설정 없이 Google 로그인으로 즉시 사용
- **Mobile First**: 스마트폰에서도 완벽한 사용성
- **Korean Optimized**: 한국 교육 현장에 특화된 UI/UX
- **AI Powered**: 개별 학생 특성을 고려한 맞춤형 설문
- **Privacy First**: 학생 데이터 보안 및 개인정보 보호

## 📄 라이선스

MIT License - 교육 목적으로 자유롭게 사용 가능

## 🤝 기여하기

이 프로젝트는 한국의 교육 현장을 지원하기 위해 개발되었습니다. 
기능 개선이나 버그 리포트는 Issues를 통해 알려주세요.

---

**Made for Korean Teachers with ❤️**