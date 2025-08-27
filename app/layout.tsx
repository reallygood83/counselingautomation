import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'

export const metadata: Metadata = {
  title: '학생 상담 자동화 시스템',
  description: 'AI 기반 학생 상담 설문 및 보고서 생성 시스템',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="min-h-screen bg-gray-50 font-pretendard">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}