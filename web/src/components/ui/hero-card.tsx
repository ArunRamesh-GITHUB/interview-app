import * as React from 'react'
import { cn } from '../../lib/utils'

export interface HeroCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  variant?: 'orange' | 'lavender'
  illustration?: React.ReactNode
  ctaButton?: {
    label: string
    onClick: () => void
    icon?: React.ReactNode
  }
}

const heroStyles = {
  orange: 'bg-primary',
  lavender: 'bg-secondary'
}

export function HeroCard({ 
  className, 
  title, 
  subtitle, 
  variant = 'lavender',
  illustration,
  ctaButton,
  ...props 
}: HeroCardProps) {
  
  return (
    <div 
      className={cn(
        'relative p-5 rounded-xl shadow-level-2 font-primary overflow-hidden',
        'min-h-[200px]',
        heroStyles[variant],
        className
      )} 
      {...props}
    >
      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between h-full">
        <div className="space-y-2">
          <h2 className="text-headline font-bold leading-tight text-white">
            {title}
          </h2>
          {subtitle && (
            <p className="text-body leading-relaxed max-w-[250px] text-white/90">
              {subtitle}
            </p>
          )}
        </div>
        
        {/* CTA Button */}
        {ctaButton && (
          <div className="mt-4">
            <button
              onClick={ctaButton.onClick}
              className={cn(
                'flex items-center justify-center gap-2',
                'w-13 h-13 bg-primary text-white rounded-pill shadow-level-3',
                'font-semibold transition-all duration-fast',
                'hover:scale-105 hover:shadow-level-3 active:scale-95',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2'
              )}
            >
              {ctaButton.icon || (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9,18 15,12 9,6"></polyline>
                </svg>
              )}
            </button>
          </div>
        )}
      </div>
      
      {/* Illustration */}
      {illustration && (
        <div className="absolute bottom-0 right-0 opacity-80 pointer-events-none">
          {illustration}
        </div>
      )}
    </div>
  )
}