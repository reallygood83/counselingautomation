'use client'

import { StudentManager } from '@/components/teacher/StudentManager'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export default function StudentsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/dashboard">
          <Button variant="outline" className="mb-4">
            ← 대시보드로 돌아가기
          </Button>
        </Link>
      </div>
      
      <StudentManager />
    </div>
  )
}