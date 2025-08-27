import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { AuthGuard } from '@/components/auth/AuthButton'

export default function Home() {
  return (
    <AuthGuard>
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl text-white">🎓</span>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              학생 상담 자동화
            </h1>
            
            <p className="text-gray-600 mb-8">
              AI 기반 설문 생성과 SEL 분석으로<br />
              효과적인 학생 상담을 지원합니다
            </p>
            
            <div className="space-y-4">
              <Link href="/dashboard" className="block">
                <Button className="w-full" size="lg">
                  📊 대시보드로 이동
                </Button>
              </Link>
              
              <Link href="/surveys" className="block">
                <Button className="w-full" size="lg" variant="outline">
                  🤖 AI 설문 생성하기
                </Button>
              </Link>
              
              <p className="text-sm text-gray-500">
                개인 Google Drive에 안전하게 저장됩니다
              </p>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              한국 교사를 위한 직관적이고 편리한 상담 도구
            </p>
          </div>
        </div>
      </main>
    </AuthGuard>
  )
}