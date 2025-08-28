import { withAuth } from 'next-auth/middleware'
import { NextRequest, NextResponse } from 'next/server'

export default withAuth(
  function middleware(request: NextRequest) {
    // 인증이 필요한 페이지들에 대한 추가 처리
    const { pathname } = request.nextUrl
    
    // 교사 페이지는 인증 필요
    if (pathname.startsWith('/teacher') && !request.nextauth.token) {
      return NextResponse.redirect(new URL('/auth/signin', request.url))
    }
    
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // 공개 페이지들
        const publicPaths = ['/', '/auth', '/student']
        if (publicPaths.some(path => pathname.startsWith(path))) {
          return true
        }
        
        // 교사 페이지는 토큰 필요
        if (pathname.startsWith('/teacher')) {
          return !!token
        }
        
        return true
      }
    }
  }
)

export const config = {
  matcher: [
    // NextAuth.js 관련 경로는 제외
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ]
}