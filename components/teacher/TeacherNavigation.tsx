'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/Button'

interface NavItem {
  id: string
  label: string
  icon: string
  href: string
  description: string
  priority: 'high' | 'medium' | 'low'
}

const navItems: NavItem[] = [
  {
    id: 'sel-survey',
    label: 'SEL 설문',
    icon: '💖',
    href: '/surveys',
    description: '새로운 SEL 설문 생성 및 배포',
    priority: 'high'
  },
  {
    id: 'responses',
    label: '응답 확인',
    icon: '📋',
    href: '/teacher/responses',
    description: '학생들의 설문 응답 확인',
    priority: 'high'
  },
  {
    id: 'students',
    label: '학생 관리',
    icon: '👥',
    href: '/teacher/students',
    description: '학생 정보 관리',
    priority: 'medium'
  },
  {
    id: 'reports',
    label: 'SEL 보고서',
    icon: '📈',
    href: '/teacher/reports',
    description: '종합 SEL 분석 보고서',
    priority: 'medium'
  },
  {
    id: 'emotion-analysis',
    label: '감정 분석',
    icon: '🪞',
    href: '/teacher/emotion',
    description: '학생 감정 상태 분석',
    priority: 'medium'
  },
  {
    id: 'google-integration',
    label: 'Google 연동',
    icon: '🔗',
    href: '/teacher/google',
    description: 'Google 서비스 연동 설정',
    priority: 'low'
  }
]

interface TeacherNavigationProps {
  currentSection?: string
}

export function TeacherNavigation({ currentSection = 'dashboard' }: TeacherNavigationProps) {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const getActiveItem = () => {
    return navItems.find(item => pathname.startsWith(item.href)) || null
  }

  const activeItem = getActiveItem()

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden lg:block bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between px-4 py-3">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">M</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-purple-600 bg-clip-text text-transparent">
                MIRA Dashboard
              </h1>
            </Link>

            {/* Navigation Items */}
            <nav className="flex items-center gap-2">
              {navItems.map((item) => (
                <Link key={item.id} href={item.href}>
                  <Button
                    variant={pathname.startsWith(item.href) ? 'default' : 'ghost'}
                    size="sm"
                    className={`flex items-center gap-2 relative ${
                      pathname.startsWith(item.href) 
                        ? 'bg-gradient-to-r from-teal-500 to-purple-600 text-white shadow-lg' 
                        : 'hover:bg-gray-100'
                    } ${item.priority === 'high' ? 'font-semibold' : ''}`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className="hidden xl:inline text-sm">{item.label}</span>
                    {item.priority === 'high' && (
                      <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                    )}
                  </Button>
                </Link>
              ))}
            </nav>

            {/* Settings */}
            <div className="flex items-center gap-2">
              <Link href="/settings">
                <Button variant="outline" size="sm">
                  ⚙️ 설정
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-teal-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">M</span>
              </div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-teal-600 to-purple-600 bg-clip-text text-transparent">
                MIRA
              </h1>
            </Link>

            {/* Current Section & Menu Button */}
            <div className="flex items-center gap-3">
              {activeItem && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{activeItem.icon}</span>
                  <span>{activeItem.label}</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="mt-3 pb-3 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-2 mt-3">
                {navItems.map((item) => (
                  <Link key={item.id} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                    <Button
                      variant={pathname.startsWith(item.href) ? 'default' : 'outline'}
                      size="sm"
                      className={`w-full h-16 flex flex-col gap-1 relative ${
                        pathname.startsWith(item.href) 
                          ? 'bg-gradient-to-r from-teal-500 to-purple-600 text-white' 
                          : ''
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span className="text-xs">{item.label}</span>
                      {item.priority === 'high' && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                      )}
                    </Button>
                  </Link>
                ))}
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-100">
                <Link href="/settings" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full">
                    ⚙️ 설정
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Breadcrumb for context */}
      {activeItem && (
        <div className="bg-gray-50 border-b border-gray-200 py-2">
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <span>{activeItem.icon}</span>
              <span>{activeItem.description}</span>
            </p>
          </div>
        </div>
      )}
    </>
  )
}