'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode, useEffect } from 'react'

interface AuthProviderProps {
  children: ReactNode
}

// Firebase 연결 상태 모니터링
function FirebaseMonitor() {
  useEffect(() => {
    const checkFirebaseConnection = async () => {
      try {
        const { auth, db } = await import('@/lib/firebase')
        console.log('🔥 Firebase 연결 상태:', {
          auth: auth ? '✅ 연결됨' : '❌ 연결 실패',
          firestore: db ? '✅ 연결됨' : '❌ 연결 실패',
          currentUser: auth.currentUser?.email || '미인증'
        })
        
        // Firebase Auth 상태 변화 감지
        auth.onAuthStateChanged((user) => {
          console.log('🔑 Firebase Auth 상태 변화:', user ? user.email : '로그아웃')
        })
        
      } catch (error) {
        console.error('❌ Firebase 연결 오류:', error)
      }
    }
    
    if (process.env.NODE_ENV === 'development') {
      checkFirebaseConnection()
    }
  }, [])
  
  return null
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <FirebaseMonitor />
      {children}
    </SessionProvider>
  )
}