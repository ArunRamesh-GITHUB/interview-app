import * as React from 'react'
import { cn } from '../lib/utils'
import { 
  AppHeader, 
  HeroCard, 
  StatPill, 
  ProgressBar
} from '../components/ui'

export interface DashboardLayoutProps {
  children?: React.ReactNode
  
  // Header props
  headerProps?: {
    avatar?: {
      src?: string
      alt: string
      fallback?: string
    }
    greeting?: string
    progressChip?: {
      label: string
      progress: number
      icon?: React.ReactNode
    }
    actions?: React.ReactNode
  }
  
  // Hero card props
  heroProps?: {
    title: string
    subtitle?: string
    gradient?: 'orange' | 'lavender'
    illustration?: React.ReactNode
    ctaButton?: {
      label: string
      onClick: () => void
      icon?: React.ReactNode
    }
  }
  
  // Stats grid props
  stats?: Array<{
    value: number
    label: string
    icon?: React.ReactNode
    size?: 'sm' | 'md'
  }>
  
  // Progress items
  progressItems?: Array<{
    label: string
    value: number
    showValue?: boolean
  }>
  
  
  className?: string
}

export function DashboardLayout({ 
  children,
  headerProps,
  heroProps,
  stats = [],
  progressItems = [],
  className 
}: DashboardLayoutProps) {
  return (
    <div className={cn('min-h-dvh bg-surface font-primary', className)}>
      {/* App Header */}
      {headerProps && (
        <AppHeader
          avatar={headerProps.avatar}
          greeting={headerProps.greeting}
          progressChip={headerProps.progressChip}
          actions={headerProps.actions}
        />
      )}
      
      {/* Main Content */}
      <main className="w-full max-w-screen-xl md:max-w-5xl mx-auto px-4 pb-20 md:pb-8 space-y-6">
        {/* Hero Card */}
        {heroProps && (
          <section className="pt-2">
            <HeroCard
              title={heroProps.title}
              subtitle={heroProps.subtitle}
              variant={heroProps.gradient}
              illustration={heroProps.illustration}
              ctaButton={heroProps.ctaButton}
            />
          </section>
        )}
        
        {/* Stats Grid (2 columns) */}
        {stats.length > 0 && (
          <section>
            <div className="grid grid-cols-2 gap-3">
              {stats.map((stat, index) => (
                <StatPill
                  key={`${stat.label}-${index}`}
                  value={stat.value}
                  label={stat.label}
                  icon={stat.icon}
                  size={stat.size || 'md'}
                />
              ))}
            </div>
          </section>
        )}
        
        {/* Progress Group */}
        {progressItems.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-title font-bold text-text-primary px-2">
              Progress
            </h2>
            <div className="space-y-3">
              {progressItems.map((item, index) => (
                <ProgressBar
                  key={`${item.label}-${index}`}
                  label={item.label}
                  value={item.value}
                  showValue={item.showValue}
                />
              ))}
            </div>
          </section>
        )}
        
        {/* Custom Children Content */}
        {children}
      </main>
      
    </div>
  )
}