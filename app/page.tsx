import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { AuthGuard } from '@/components/auth/AuthButton'

export default function Home() {
  return (
    <AuthGuard>
      <main className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* MIRA 로고 */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-teal-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                <div className="text-white text-center">
                  <div className="text-2xl mb-1">🪞</div>
                  <div className="text-xs font-bold tracking-wider">MIRA</div>
                </div>
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-pink-400 rounded-full flex items-center justify-center">
                <span className="text-xs">💖</span>
              </div>
            </div>
            
            <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-purple-600 bg-clip-text text-transparent mb-2">
              MIRA
            </h1>
            
            <p className="text-sm text-teal-600 font-medium mb-4">
              Mirroring Inner Reality and Affect
            </p>
            
            <p className="text-gray-600 mb-8">
              학생의 내면과 감정을 반영하는<br />
              AI 기반 사회정서학습(SEL) 상담 시스템
            </p>
            
            <div className="space-y-4">
              <Link href="/dashboard" className="block">
                <Button className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white border-none" size="lg">
                  🪞 상담 대시보드
                </Button>
              </Link>
              
              <Link href="/surveys" className="block">
                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-none" size="lg">
                  💖 SEL 설문 생성
                </Button>
              </Link>
              
              <p className="text-sm text-teal-600">
                💾 개인 Google Drive에 안전하게 저장
              </p>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-purple-600 font-medium">
              ✨ 학생의 마음을 이해하는 AI 상담 파트너
            </p>
          </div>
        </div>
      </main>
    </AuthGuard>
  )
}