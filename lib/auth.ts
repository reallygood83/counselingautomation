import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

export const authOptions: NextAuthOptions = {
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
    async jwt({ token, account }) {
      // Google OAuth 토큰을 JWT에 저장
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.accessTokenExpires = account.expires_at
      }
      
      // 토큰 만료 시 갱신
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires * 1000) {
        return token
      }
      
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