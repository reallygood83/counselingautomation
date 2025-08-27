'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

export function AuthButton() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <Button disabled>
        로딩중...
      </Button>
    )
  }

  if (session) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          {session.user?.image && (
            <img 
              src={session.user.image} 
              alt="Profile" 
              className="w-8 h-8 rounded-full"
            />
          )}
          <div className="text-sm">
            <p className="font-medium">{session.user?.name}</p>
            <p className="text-gray-600">{session.user?.email}</p>
          </div>
        </div>
        <Button 
          variant="outline" 
          onClick={() => signOut()}
        >
          로그아웃
        </Button>
      </div>
    )
  }

  return (
    <Button 
      onClick={() => signIn('google')}
      className="flex items-center gap-2"
    >
      <span>🔐</span>
      Google로 시작하기
    </Button>
  )
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">로딩중...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl text-white">🎓</span>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              학생 상담 자동화
            </h1>
            
            <p className="text-gray-600 mb-8">
              Google 계정으로 로그인하여<br />
              개인 상담 데이터를 안전하게 관리하세요
            </p>
            
            <AuthButton />
            
            <div className="mt-6 text-sm text-gray-500">
              <p>✅ 개인 Google Drive에 데이터 저장</p>
              <p>✅ 완전한 데이터 소유권 보장</p>
              <p>✅ 타 사용자와 데이터 격리</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}