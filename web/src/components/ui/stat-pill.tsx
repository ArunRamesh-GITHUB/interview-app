import * as React from 'react'
import { cn } from '../../lib/utils'
import { formatTabularNumber } from '../../lib/tokens'

export interface StatPillProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  label: string
  icon?: React.ReactNode
  size?: 'sm' | 'md'
}

const sizeStyles = {
  sm: {
    container: 'h-12 px-3 py-2.5',
    number: 'text-title',
    label: 'text-caption'
  },
  md: {
    container: 'h-16 px-3.5 py-3',
    number: 'text-headline',
    label: 'text-label'
  }
}

export function StatPill({ 
  className, 
  value, 
  label, 
  icon, 
  size = 'md',
  ...props 
}: StatPillProps) {
  const styles = sizeStyles[size]
  const formattedValue = formatTabularNumber(value, { notation: 'compact' })
  
  return (
    <div 
      className={cn(
        'flex items-center gap-3 bg-card border border-divider rounded-lg shadow-level-1 font-primary',
        styles.container,
        className
      )} 
      {...props}
    >
      {icon && (
        <div className="flex items-center justify-center w-6 h-6 text-text-secondary">
          {icon}
        </div>
      )}
      
      <div className="flex flex-col justify-center min-w-0">
        <div className={cn(
          'font-numeric font-extrabold text-text-primary leading-none',
          styles.number
        )}>
          {formattedValue}
        </div>
        <div className={cn(
          'font-primary font-semibold text-text-secondary leading-none mt-0.5',
          styles.label
        )}>
          {label}
        </div>
      </div>
    </div>
  )
}