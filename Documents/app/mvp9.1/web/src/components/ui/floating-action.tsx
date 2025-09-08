import * as React from 'react'
import { cn } from '../../lib/utils'

export interface FloatingActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  offset?: [number, number] // [horizontal, vertical] in pixels
}

const positionStyles = {
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4', 
  'top-right': 'top-4 right-4',
  'top-left': 'top-4 left-4'
}

export function FloatingAction({ 
  className, 
  icon, 
  position = 'bottom-right',
  offset = [16, 90], // Default from design system
  children,
  ...props 
}: FloatingActionProps) {
  const [offsetX, offsetY] = offset
  
  return (
    <button
      className={cn(
        'fixed z-50 flex items-center justify-center',
        'w-14 h-14 bg-primary text-primary-on rounded-pill shadow-level-3',
        'font-primary transition-all duration-fast',
        'hover:scale-105 hover:shadow-level-3 active:scale-95',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4F46E5] focus-visible:outline-offset-2',
        positionStyles[position],
        className
      )}
      style={{
        [position.includes('right') ? 'right' : 'left']: `${offsetX}px`,
        [position.includes('bottom') ? 'bottom' : 'top']: `${offsetY}px`
      }}
      {...props}
    >
      {icon || children || (
        // Default plus icon
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      )}
    </button>
  )
}