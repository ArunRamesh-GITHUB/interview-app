import * as React from 'react'
import { cn } from '../../lib/utils'
import { AvatarGroup, Avatar } from './avatar-group'

export interface CourseCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  badges?: string[]
  avatars?: Avatar[]
  deltaChip?: {
    label: string
    variant?: 'success' | 'warning' | 'error'
  }
  variant?: 'default' | 'orange' | 'lavender'
  onAction?: () => void
  illustration?: React.ReactNode
}

const cardVariants = {
  default: 'bg-card',
  orange: 'bg-card-tinted-orange',
  lavender: 'bg-card-tinted-lavender'
}

const deltaVariants = {
  success: 'bg-success text-card',
  warning: 'bg-warning text-text-primary',
  error: 'bg-error text-card'
}

export function CourseCard({ 
  className,
  title,
  badges = [],
  avatars = [],
  deltaChip,
  variant = 'default',
  onAction,
  illustration,
  ...props 
}: CourseCardProps) {
  return (
    <div 
      className={cn(
        'relative p-5 rounded-xl border border-divider shadow-level-1 font-primary',
        'transition-all duration-fast hover:shadow-level-2 hover:-translate-y-0.5',
        cardVariants[variant],
        className
      )} 
      {...props}
    >
      {/* Badge Row */}
      {badges.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {badges.map((badge, index) => (
            <span 
              key={index}
              className="px-2 py-1 bg-surface-alt text-text-secondary text-caption font-semibold rounded"
            >
              {badge}
            </span>
          ))}
        </div>
      )}
      
      {/* Title */}
      <h3 className="text-title font-bold text-text-primary mb-3 leading-tight">
        {title}
      </h3>
      
      {/* Meta Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {avatars.length > 0 && (
            <AvatarGroup avatars={avatars} size="sm" max={4} />
          )}
          
          {deltaChip && (
            <span className={cn(
              'px-2 py-1 rounded text-caption font-bold',
              deltaVariants[deltaChip.variant || 'success']
            )}>
              {deltaChip.label}
            </span>
          )}
        </div>
        
        {/* Action Button */}
        {onAction && (
          <button
            onClick={onAction}
            className={cn(
              'flex items-center justify-center w-11 h-11 bg-primary text-primary-on rounded-pill',
              'shadow-level-1 transition-all duration-fast',
              'hover:scale-105 hover:shadow-level-2 active:scale-95',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4F46E5] focus-visible:outline-offset-2'
            )}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9,18 15,12 9,6"></polyline>
            </svg>
          </button>
        )}
      </div>
      
      {/* Background Illustration */}
      {illustration && (
        <div className="absolute bottom-0 right-0 opacity-20 pointer-events-none overflow-hidden">
          {illustration}
        </div>
      )}
    </div>
  )
}