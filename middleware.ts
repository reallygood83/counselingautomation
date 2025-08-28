import { withAuth } from 'next-auth/middleware'

export default withAuth(
  // middleware 함수는 authorized가 true를 반환한 경우에만 실행됩니다
  function middleware(req) {
    // 추가적인 미들웨어 로직이 필요한 경우 여기에 작성
    // 현재는 authorized 콜백에서 모든 인증 로직을 처리하므로 비워둡니다
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