import * as React from 'react'
import { cn } from '../lib/utils'
import { 
  Chip, 
  CourseCard, 
  type Avatar 
} from '../components/ui'

export interface CoursesLayoutProps {
  children?: React.ReactNode
  
  // Header props
  headerTitle?: string
  headerSubtitle?: string
  
  // Filter chips
  filters?: Array<{
    id: string
    label: string
    icon?: React.ReactNode
    selected?: boolean
    onClick?: () => void
  }>
  
  // Course cards
  courses?: Array<{
    id: string
    title: string
    badges?: string[]
    avatars?: Avatar[]
    deltaChip?: {
      label: string
      variant?: 'success' | 'warning' | 'error'
    }
    variant?: 'default' | 'orange' | 'lavender'
    onAction?: () => void
    illustration?: React.ReactNode
  }>
  
  // Layout options
  showFilters?: boolean
  className?: string
}

export function CoursesLayout({ 
  children,
  headerTitle = "Courses",
  headerSubtitle,
  filters = [],
  courses = [],
  showFilters = true,
  className 
}: CoursesLayoutProps) {
  return (
    <div className={cn('min-h-dvh bg-surface font-primary', className)}>
      {/* Header with dark grey background */}
      <header className="px-4 py-6 rounded-b-xl" style={{ backgroundColor: '#121317' }}>
        <div className="space-y-2">
          <h1 className="text-headline font-bold text-white">
            {headerTitle}
          </h1>
          {headerSubtitle && (
            <p className="text-body text-white/80">
              {headerSubtitle}
            </p>
          )}
        </div>
      </header>
      
      {/* Main Content */}
      <main className="w-full max-w-screen-xl md:max-w-5xl mx-auto px-4 pb-20 md:pb-8">
        {/* Horizontal Filter Chips */}
        {showFilters && filters.length > 0 && (
          <section className="py-2 -mx-4">
            <div className="flex gap-2 px-4 overflow-x-auto scrollbar-hide">
              {filters.map((filter) => (
                <div key={filter.id} className="flex-shrink-0">
                  <Chip
                    selected={filter.selected}
                    icon={filter.icon}
                    onClick={filter.onClick}
                  >
                    {filter.label}
                  </Chip>
                </div>
              ))}
            </div>
          </section>
        )}
        
        {/* Course Cards List */}
        {courses.length > 0 && (
          <section className="space-y-3 pt-4">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                title={course.title}
                badges={course.badges}
                avatars={course.avatars}
                deltaChip={course.deltaChip}
                variant={course.variant}
                onAction={course.onAction}
                illustration={course.illustration}
              />
            ))}
          </section>
        )}
        
        {/* Custom Children Content */}
        {children}
      </main>
      
      
      {/* Hide horizontal scrollbar globally */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}