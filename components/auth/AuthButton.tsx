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
      className="flex items-center gap-3 bg-teal-600 hover:bg-teal-700 text-white font-medium py-3 px-6 text-base shadow-lg hover:shadow-xl transition-all duration-200"
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-purple-50 to-pink-50">
        <div className="text-center">
          {/* MIRA 로고 애니메이션 */}
          <div className="relative mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center mx-auto animate-pulse shadow-lg">
              <span className="text-2xl font-bold text-white">M</span>
            </div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-teal-200 border-t-teal-500 rounded-full animate-spin mx-auto"></div>
          </div>
          
          {/* 로딩 텍스트 */}
          <div className="space-y-2">
            <p className="text-teal-700 font-medium text-lg">MIRA 시작 중...</p>
            <p className="text-gray-600 text-sm">학생 상담 시스템을 준비하고 있습니다</p>
          </div>
          
          {/* 로딩 바 */}
          <div className="mt-6 w-48 h-1 bg-gray-200 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-teal-500 to-purple-500 animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-purple-50 to-pink-50">
        <Card className="max-w-md w-full mx-4 shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-10 text-center">
            {/* MIRA 로고 */}
            <div className="relative mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <span className="text-3xl font-bold text-white">M</span>
              </div>
              <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full"></div>
            </div>
            
            {/* 제목 */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-teal-700 mb-2">
                MIRA
              </h1>
              <h2 className="text-lg text-gray-600 font-medium">
                Mirroring Inner Reality and Affect
              </h2>
            </div>
            
            {/* 설명 */}
            <div className="mb-8 space-y-2">
              <p className="text-gray-700 font-medium">
                AI 기반 사회정서학습 상담 시스템
              </p>
              <p className="text-sm text-gray-600">
                Google 계정으로 로그인하여<br />
                학생들의 내면과 감정을 안전하게 분석하고 관리하세요
              </p>
            </div>
            
            {/* 로그인 버튼 */}
            <AuthButton />
            
            {/* 보안 정보 */}
            <div className="mt-8 p-4 bg-gradient-to-r from-teal-50 to-purple-50 rounded-xl border border-teal-100">
              <div className="text-sm space-y-2">
                <div className="flex items-center justify-center gap-2 text-teal-700">
                  <span>✅</span>
                  <span className="font-medium">개인 Google Drive에 데이터 저장</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-purple-700">
                  <span>✅</span>
                  <span className="font-medium">완전한 데이터 소유권 보장</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-pink-700">
                  <span>✅</span>
                  <span className="font-medium">타 사용자와 데이터 격리</span>
                </div>
              </div>
            </div>
            
            {/* 추가 설명 */}
            <div className="mt-6 text-xs text-gray-500 leading-relaxed">
              <p>실시간 감정 분석 • SEL 보고서 • 맞춤형 상담 지원</p>
              <p className="mt-1">학생들의 건강한 성장을 위한 AI 파트너</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}