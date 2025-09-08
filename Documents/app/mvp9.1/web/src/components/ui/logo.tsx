import * as React from 'react'
import { cn } from '../../lib/utils'

export interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Logo({ size = 'md', className, ...props }: LogoProps) {
  const sizeClasses = {
    sm: 'h-10 text-2xl', // ~40px
    md: 'h-12 text-3xl', // ~48px  
    lg: 'h-16 text-4xl' // ~64px
  }

  return (
    <div className={cn('flex items-center gap-0', sizeClasses[size], className)} {...props}>
      <span className="font-black text-white">nail</span>
      <span className="font-black text-orange-500">it</span>
    </div>
  )
}