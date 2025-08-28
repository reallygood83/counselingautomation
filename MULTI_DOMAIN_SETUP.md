# 멀티 도메인 OAuth 설정 가이드

## 📋 설정 완료된 항목

### 1. NextAuth 설정 업데이트 ✅
- 멀티 도메인 지원을 위한 동적 URL 처리 구현
- redirect 콜백 추가로 도메인 간 안전한 리디렉션 처리
- VALID_DOMAINS 목록으로 허용 도메인 관리

### 2. 환경 변수 설정 ✅
- 개발 환경: `http://localhost:3001`
- 프로덕션 환경: 동적 처리 (Host 헤더 기반)

## 🔧 Google OAuth 콘솔에서 추가 설정 필요

### Authorized redirect URIs에 다음 URL들을 모두 추가하세요:

**개발 환경:**
```
http://localhost:3000/api/auth/callback/google
http://localhost:3001/api/auth/callback/google
```

**프로덕션 환경:**
```
https://miraclass.link/api/auth/callback/google
https://[기존-vercel-도메인].vercel.app/api/auth/callback/google
```

### 설정 방법:
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택
3. APIs & Services > Credentials
4. OAuth 2.0 클라이언트 ID 선택
5. Authorized redirect URIs에 위 URL들 모두 추가
6. 저장

## 🌐 Vercel 환경 변수 설정 (권장)

### ✅ 멀티 도메인을 위한 최적 설정
**NEXTAUTH_URL을 삭제하고 동적 처리 사용** (권장)

Vercel 환경변수에서 `NEXTAUTH_URL`을 **삭제**하세요:
- 삭제하면 NextAuth가 현재 요청의 Host 헤더를 자동으로 사용
- miraclass.link와 Vercel 도메인 모두에서 자동으로 올바른 URL 생성
- 더 유연하고 안정적인 멀티 도메인 지원

### 필수 환경 변수 (Vercel에서 유지)
```
NEXTAUTH_SECRET=[기존-시크릿]
GOOGLE_CLIENT_ID=[기존-클라이언트-ID]  
GOOGLE_CLIENT_SECRET=[기존-클라이언트-시크릿]
```

### ❌ 삭제할 환경 변수
```
NEXTAUTH_URL (삭제 권장 - 동적 처리가 더 효과적)
```

## ✨ 새로운 기능

### 자동 도메인 감지
- NextAuth가 현재 요청의 Host 헤더를 기반으로 올바른 redirect URI를 자동 생성
- 두 도메인 모두에서 원활한 OAuth 인증 지원

### 안전한 리디렉션
- VALID_DOMAINS 목록에 있는 도메인만 허용
- 피싱 공격 등으로부터 보호

### 개발자 친화적
- 로컬 개발 환경에서도 포트 3000, 3001 모두 지원
- 환경 변수 최소화로 설정 단순화

## 🚀 배포 및 설정 순서

### 1단계: Vercel 환경변수 정리
1. Vercel Dashboard → 프로젝트 → Settings → Environment Variables
2. **NEXTAUTH_URL 삭제** (있다면)
3. 다음 3개 환경변수만 유지:
   - `NEXTAUTH_SECRET`
   - `GOOGLE_CLIENT_ID` 
   - `GOOGLE_CLIENT_SECRET`

### 2단계: Google OAuth 설정
1. [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → Credentials → OAuth 2.0 클라이언트 ID
3. Authorized redirect URIs에 4개 URL 모두 추가:
   ```
   http://localhost:3000/api/auth/callback/google
   http://localhost:3001/api/auth/callback/google
   https://miraclass.link/api/auth/callback/google
   https://[기존-vercel-도메인].vercel.app/api/auth/callback/google
   ```

### 3단계: 배포 후 테스트
1. **miraclass.link에서 테스트:**
   - https://miraclass.link 접속
   - 구글 로그인 시도
   - 정상 로그인 및 리디렉션 확인

2. **기존 Vercel 도메인에서 테스트:**
   - https://[기존-도메인].vercel.app 접속
   - 구글 로그인 시도
   - 정상 로그인 및 리디렉션 확인

## 🔍 문제 해결

### redirect_uri_mismatch 오류가 여전히 발생하는 경우:
1. Google OAuth 콘솔에서 모든 redirect URI가 정확히 설정되었는지 확인
2. 브라우저 캐시 클리어
3. 개발자 도구에서 실제 요청되는 redirect_uri 확인
4. NextAuth 로그 확인: `NEXTAUTH_DEBUG=true` 환경 변수 추가

### 세션 공유가 안 되는 경우:
- 브라우저의 쿠키 정책으로 인해 도메인 간 세션 공유는 제한적
- 각 도메인에서 개별 로그인이 필요할 수 있음
- 이는 보안상 정상적인 동작입니다