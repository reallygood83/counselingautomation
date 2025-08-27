import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { Footer } from '@/components/ui/Footer'

export const metadata: Metadata = {
  title: 'MIRA - Mirroring Inner Reality and Affect',
  description: '학생의 내면과 감정을 반영하는 AI 기반 사회정서학습(SEL) 상담 시스템',
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
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#0d9488" />
        <meta property="og:title" content="MIRA - Mirroring Inner Reality and Affect" />
        <meta property="og:description" content="학생의 내면과 감정을 반영하는 AI 기반 사회정서학습(SEL) 상담 시스템" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://counselingautomation.vercel.app" />
        <meta name="twitter:card" content="summary_large_image" />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-teal-50 via-purple-50 to-pink-50 font-pretendard flex flex-col">
        <AuthProvider>
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  )
}