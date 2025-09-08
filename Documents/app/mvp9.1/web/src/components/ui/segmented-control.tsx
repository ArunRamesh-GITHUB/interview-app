import * as React from 'react'
import { cn } from '../../lib/utils'

export interface SegmentedControlOption {
  value: string
  label: string
}

export interface SegmentedControlProps {
  options: SegmentedControlOption[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function SegmentedControl({ 
  options, 
  value, 
  onChange, 
  className 
}: SegmentedControlProps) {
  const activeIndex = options.findIndex(option => option.value === value)
  
  return (
    <div 
      className={cn(
        'relative flex bg-surface-alt rounded-pill p-1 shadow-level-1 font-primary',
        'h-12', // Increased height for better text fit
        className
      )}
      role="tablist"
    >
      {/* Moving thumb/indicator */}
      <div 
        className="absolute inset-y-1 bg-card rounded-pill shadow-level-1 transition-all duration-standard ease-in-out"
        style={{
          width: `${100 / options.length}%`,
          left: `${(activeIndex * 100) / options.length}%`
        }}
      />
      
      {options.map((option, index) => (
        <button
          key={option.value}
          className={cn(
            'relative z-10 flex-1 px-3 py-2 text-label font-semibold transition-colors duration-fast',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4F46E5] focus-visible:outline-offset-2 rounded-pill',
            'min-h-[40px] min-w-[44px]',
            value === option.value 
              ? 'text-text-primary' 
              : 'text-text-secondary hover:text-text-primary'
          )}
          onClick={() => onChange(option.value)}
          role="tab"
          aria-selected={value === option.value}
          tabIndex={value === option.value ? 0 : -1}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}