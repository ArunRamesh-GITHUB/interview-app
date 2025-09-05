import * as React from 'react'
import { cn } from '../../lib/utils'
import { snapTo5 } from '../../lib/tokens'

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number // 0-100
  label?: string
  showValue?: boolean
}

export function ProgressBar({ 
  className, 
  value, 
  label, 
  showValue = true, 
  ...props 
}: ProgressBarProps) {
  const snappedValue = snapTo5(Math.max(0, Math.min(100, value)))
  
  return (
    <div className={cn('w-full', className)} {...props}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-subtitle font-primary font-semibold text-text-primary">
            {label}
          </span>
          {showValue && (
            <span className="text-caption font-primary font-semibold text-text-secondary">
              {snappedValue}%
            </span>
          )}
        </div>
      )}
      
      <div className="relative w-full h-3 bg-divider rounded-lg overflow-hidden">
        <div 
          className="h-full bg-primary rounded-lg transition-all duration-standard ease-decelerate"
          style={{ width: `${snappedValue}%` }}
        />
        
        {/* Optional value bubble */}
        {showValue && snappedValue > 10 && (
          <div 
            className="absolute top-1/2 -translate-y-1/2 px-2 py-1 bg-text-primary text-card rounded text-caption font-primary font-semibold pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-fast"
            style={{ left: `${Math.max(10, Math.min(85, snappedValue - 5))}%` }}
          >
            {snappedValue}%
          </div>
        )}
      </div>
    </div>
  )
}