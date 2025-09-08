import * as React from 'react'
import { cn } from '../../lib/utils'

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
  icon?: React.ReactNode
}

export function Chip({ className, selected = false, icon, children, ...props }: ChipProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center gap-2 px-3 py-2 h-8 rounded-pill font-primary text-label font-semibold transition-all duration-fast',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4F46E5] focus-visible:outline-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none min-h-[44px] min-w-[44px]',
        selected 
          ? 'bg-secondary text-secondary-on shadow-level-1' 
          : 'bg-surface-alt text-text-secondary hover:bg-border hover:text-text-primary',
        className
      )}
      {...props}
    >
      {icon && (
        <span className="flex items-center justify-center w-4 h-4">
          {icon}
        </span>
      )}
      {children}
    </button>
  )
}