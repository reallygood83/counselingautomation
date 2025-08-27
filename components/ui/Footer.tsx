'use client'

import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center space-y-4">
          {/* MIRA 로고 및 브랜드명 */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-purple-600 rounded-full flex items-center justify-center">
              <div className="text-white text-center">
                <div className="text-lg">🪞</div>
                <div className="text-xs font-bold tracking-wider -mt-1">MIRA</div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-teal-600 to-purple-600 bg-clip-text text-transparent">
                MIRA 상담 자동화
              </h3>
              <p className="text-xs text-gray-600">Mirroring Inner Reality and Affect</p>
            </div>
          </div>

          {/* 카피라이트 */}
          <div className="space-y-3">
            <p className="text-gray-600 font-medium">
              © 2025 MIRA 상담 자동화
            </p>
            
            {/* 링크들 */}
            <div className="flex items-center justify-center gap-6 text-sm">
              <Link 
                href="/privacy" 
                className="text-teal-600 hover:text-teal-800 hover:underline transition-colors"
              >
                개인정보처리방침
              </Link>
              <span className="text-gray-400">|</span>
              <a 
                href="https://github.com/reallygood83/counselingautomation" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-800 hover:underline transition-colors"
              >
                GitHub
              </a>
              <span className="text-gray-400">|</span>
              <span className="text-gray-500">교육용 도구</span>
            </div>

            {/* 부가 정보 */}
            <div className="text-xs text-gray-500 space-y-1">
              <p>학생의 사회정서학습(SEL)을 위한 AI 기반 상담 지원 시스템</p>
              <p>안양 박달초등학교 | 교육혁신을 위한 디지털 전환</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}