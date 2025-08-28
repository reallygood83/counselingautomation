import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { Footer } from '@/components/ui/Footer'

export const metadata: Metadata = {
  title: 'MIRA - Mirroring Inner Reality and Affect',
  description: '학생의 내면과 감정을 반영하는 AI 기반 사회정서학습(SEL) 상담 시스템. 실시간 감정 분석과 맞춤형 상담 지원을 통해 학생들의 건강한 성장을 돕습니다.',
  keywords: ['SEL', '사회정서학습', 'AI 상담', '학생 상담', '감정 분석', '교육 기술', 'EdTech'],
  authors: [{ name: 'MIRA Team' }],
  creator: 'MIRA - AI 기반 SEL 상담 시스템',
  publisher: 'MIRA',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://miraclass.link'),
  alternates: {
    canonical: 'https://miraclass.link',
  },
  openGraph: {
    title: 'MIRA - AI 기반 사회정서학습 상담 시스템',
    description: '학생의 내면과 감정을 반영하는 AI 기반 상담 플랫폼. 실시간 감정 분석, SEL 보고서, 맞춤형 상담 지원으로 학생들의 건강한 성장을 돕습니다.',
    url: 'https://miraclass.link',
    siteName: 'MIRA - Mirroring Inner Reality and Affect',
    images: [
      {
        url: '/og-image.svg',
        width: 1200,
        height: 630,
        alt: 'MIRA - AI 기반 사회정서학습 상담 시스템',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MIRA - AI 기반 사회정서학습 상담 시스템',
    description: '학생의 내면과 감정을 반영하는 AI 기반 상담 플랫폼으로 건강한 성장을 지원합니다.',
    images: ['/og-image.svg'],
    creator: '@MIRA_SEL',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_VERIFICATION_ID,
    other: {
      'naver-site-verification': process.env.NAVER_VERIFICATION_ID || '',
    },
  },
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
        
        {/* 파비콘 설정 */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* 테마 및 색상 */}
        <meta name="theme-color" content="#0d9488" />
        <meta name="msapplication-TileColor" content="#0d9488" />
        <meta name="msapplication-navbutton-color" content="#0d9488" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        
        {/* 검색 엔진 최적화 */}
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <link rel="canonical" href="https://miraclass.link" />
        
        {/* Open Graph 추가 메타태그 */}
        <meta property="og:image" content="https://miraclass.link/og-image.svg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="MIRA - AI 기반 사회정서학습 상담 시스템" />
        
        {/* 추가 소셜 미디어 태그 */}
        <meta name="twitter:image" content="https://miraclass.link/og-image.svg" />
        <meta property="fb:app_id" content="your_facebook_app_id" />
        
        {/* 추가 SEO 태그 */}
        <meta name="application-name" content="MIRA" />
        <meta name="apple-mobile-web-app-title" content="MIRA" />
        <meta name="format-detection" content="telephone=no, address=no, email=no" />
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