'use client'

import { StudentManager } from '@/components/teacher/StudentManager'
import { TeacherNavigation } from '@/components/teacher/TeacherNavigation'

export default function StudentsPage() {
  return (
    <div className="min-h-screen">
      <TeacherNavigation currentSection="students" />
      
      <div className="container mx-auto px-4 py-8">
        <StudentManager />
      </div>
    </div>
  )
}