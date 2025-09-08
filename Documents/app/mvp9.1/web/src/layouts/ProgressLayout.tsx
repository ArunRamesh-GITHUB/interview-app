import * as React from 'react'
import { cn } from '../lib/utils'
import { 
  AppHeader, 
  SegmentedControl, 
  BarChart, 
  RatingRow, 
  type Avatar,
  type BarChartData,
  type SegmentedControlOption 
} from '../components/ui'

export interface ProgressLayoutProps {
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
  
  // Segmented control for time periods
  timeControl?: {
    options: SegmentedControlOption[]
    value: string
    onChange: (value: string) => void
  }
  
  // Chart data
  chartData?: BarChartData[]
  chartHeight?: number
  
  // Rating rows below chart
  ratingRows?: Array<{
    id: string
    avatars?: Avatar[]
    label: string
    badge?: string
    rating?: number
  }>
  
  className?: string
}

export function ProgressLayout({ 
  children,
  headerProps,
  timeControl,
  chartData = [],
  chartHeight = 220,
  ratingRows = [],
  className 
}: ProgressLayoutProps) {
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
        {/* Time Period Toggle */}
        {timeControl && (
          <section className="pt-2">
            <SegmentedControl
              options={timeControl.options}
              value={timeControl.value}
              onChange={timeControl.onChange}
              className="w-full"
            />
          </section>
        )}
        
        {/* Bar Chart */}
        {chartData.length > 0 && (
          <section className="bg-card rounded-xl p-4 shadow-level-1">
            <BarChart 
              data={chartData} 
              height={chartHeight}
              showValues={true}
              maxBars={7}
            />
          </section>
        )}
        
        {/* Rating Rows */}
        {ratingRows.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-title font-bold text-text-primary px-2">
              Recent Activity
            </h2>
            <div className="space-y-2">
              {ratingRows.map((row) => (
                <RatingRow
                  key={row.id}
                  avatars={row.avatars}
                  label={row.label}
                  badge={row.badge}
                  rating={row.rating}
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