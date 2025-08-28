import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

// 동적 URL 처리 함수 - 멀티 도메인 지원
const getBaseUrl = () => {
  // 개발 환경
  if (process.env.NODE_ENV === 'development') {
    return `http://localhost:${process.env.PORT || 3001}`
  }
  
  // 프로덕션 환경에서 현재 요청의 Host 헤더를 기반으로 동적 결정
  // 이는 NextAuth가 올바른 redirect_uri를 생성하도록 돕습니다
  if (typeof window !== 'undefined') {
    // 클라이언트 사이드에서는 현재 도메인 사용
    return `${window.location.protocol}//${window.location.host}`
  }
  
  // 서버 사이드에서는 환경 변수 순서로 결정
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL
  }
  
  // Vercel 환경변수
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  
  // 기본값 (커스텀 도메인)
  return 'https://miraclass.link'
}

// 유효한 도메인 목록
const VALID_DOMAINS = [
  'https://miraclass.link',
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  'http://localhost:3001',
  'http://localhost:3000'
].filter(Boolean) as string[]

export const authOptions: NextAuthOptions = {
  // 멀티 도메인 지원을 위해 site 속성 제거 - NextAuth가 Host 헤더 기반으로 동적 처리
  
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/forms https://www.googleapis.com/auth/spreadsheets'
        }
      }
    })
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // 멀티 도메인 지원을 위한 redirect 콜백
      try {
        const parsedUrl = new URL(url)
        const parsedBaseUrl = new URL(baseUrl)
        
        // 현재 도메인이 유효한 도메인 목록에 있는지 확인
        const isValidDomain = VALID_DOMAINS.some(domain => {
          const parsedDomain = new URL(domain)
          return parsedUrl.hostname === parsedDomain.hostname || 
                 parsedBaseUrl.hostname === parsedDomain.hostname
        })
        
        if (isValidDomain) {
          // 같은 도메인이면 그대로 리디렉션
          if (parsedUrl.hostname === parsedBaseUrl.hostname) {
            return url
          }
          // 다른 유효한 도메인으로의 리디렉션인 경우
          return `${parsedBaseUrl.origin}${parsedUrl.pathname}${parsedUrl.search}`
        }
      } catch (error) {
        console.log('Redirect URL parsing error:', error)
      }
      
      // 기본적으로는 baseUrl로 리디렉션
      return baseUrl
    },
    async jwt({ token, account }) {
      // Google OAuth 토큰을 JWT에 저장
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.accessTokenExpires = account.expires_at
      }
      
      // 토큰이 아직 유효한 경우 그대로 반환
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires * 1000) {
        return token
      }
      
      // 토큰이 만료되었거나 만료 시간이 없는 경우 갱신 필요
      
      // 토큰 갱신 시도
      if (token.refreshToken) {
        try {
          const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              client_id: process.env.GOOGLE_CLIENT_ID!,
              client_secret: process.env.GOOGLE_CLIENT_SECRET!,
              grant_type: 'refresh_token',
              refresh_token: token.refreshToken as string,
            }),
          })
          
          const refreshedTokens = await response.json()
          
          if (!response.ok) {
            throw refreshedTokens
          }
          
          return {
            ...token,
            accessToken: refreshedTokens.access_token,
            accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
            refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
          }
        } catch (error) {
          console.error('토큰 갱신 실패:', error)
          return {
            ...token,
            error: 'RefreshAccessTokenError',
          }
        }
      }
      
      return token
    },
    async session({ session, token }) {
      // JWT 토큰을 세션에 포함
      session.accessToken = token.accessToken
      session.error = token.error
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
}