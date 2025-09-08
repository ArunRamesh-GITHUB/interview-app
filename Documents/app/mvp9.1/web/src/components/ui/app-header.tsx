import * as React from 'react'
import { cn } from '../../lib/utils'

export interface AppHeaderProps extends React.HTMLAttributes<HTMLHeaderElement> {
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
  compact?: boolean
}

export function AppHeader({ 
  className, 
  avatar, 
  greeting, 
  progressChip, 
  actions,
  compact = false,
  ...props 
}: AppHeaderProps) {
  return (
    <header 
      className={cn(
        'flex items-center justify-between gap-3 px-4 py-4 bg-surface font-primary border-primary shadow-level-2 border rounded-xl mx-4 mt-2',
        compact ? 'h-14' : 'h-auto',
        className
      )} 
      {...props}
    >
      {/* Left side: Avatar + Greeting */}
      <div className="flex items-center gap-3">
        {avatar && (
          <div className="w-10 h-10 rounded-full bg-surface-alt border-2 border-card shadow-level-1 overflow-hidden flex-shrink-0">
            {avatar.src ? (
              <img
                src={avatar.src}
                alt={avatar.alt}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-primary text-primary-on font-semibold text-sm">
                {avatar.fallback || avatar.alt.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        )}
        
        {greeting && (
          <div className="min-w-0">
            <h1 className={cn(
              'font-primary font-bold text-text-primary leading-tight',
              compact ? 'text-subtitle' : 'text-title'
            )}>
              {greeting}
            </h1>
          </div>
        )}
      </div>
      
      {/* Center: Progress Chip - Hidden on mobile */}
      {progressChip && (
        <div className="hidden sm:flex flex-1 mx-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-pill shadow-level-1 border border-divider w-full">
            {progressChip.icon && (
              <div className="w-4 h-4 text-primary flex-shrink-0">
                {progressChip.icon}
              </div>
            )}
            <span className="text-label font-semibold text-text-primary flex-shrink-0">
              {progressChip.label}
            </span>
            <div className="flex-1 h-1.5 bg-divider rounded-pill overflow-hidden ml-2">
              <div 
                className="h-full bg-primary rounded-pill transition-all duration-standard"
                style={{ width: `${Math.min(100, Math.max(0, progressChip.progress))}%` }}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Right side: Actions */}
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {actions}
        </div>
      )}
    </header>
  )
}