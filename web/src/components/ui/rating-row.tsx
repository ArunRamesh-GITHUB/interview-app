import * as React from 'react'
import { cn } from '../../lib/utils'
import { AvatarGroup, Avatar } from './avatar-group'

export interface RatingRowProps extends React.HTMLAttributes<HTMLDivElement> {
  avatars?: Avatar[]
  label: string
  badge?: string
  rating?: number
}

export function RatingRow({ 
  className, 
  avatars = [], 
  label, 
  badge,
  rating,
  ...props 
}: RatingRowProps) {
  return (
    <div 
      className={cn(
        'flex items-center justify-between p-4 bg-card border border-divider rounded-lg shadow-level-0',
        'font-primary transition-all duration-fast hover:shadow-level-1',
        className
      )} 
      {...props}
    >
      <div className="flex items-center gap-3">
        {avatars.length > 0 && (
          <AvatarGroup avatars={avatars} size="sm" max={3} />
        )}
        <span className="text-subtitle font-semibold text-text-primary">
          {label}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        {rating && (
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <span 
                key={i} 
                className={cn(
                  'text-sm',
                  i < rating ? 'text-accent' : 'text-divider'
                )}
              >
                ⭐
              </span>
            ))}
          </div>
        )}
        {badge && (
          <span className="px-2 py-1 bg-success text-card rounded text-caption font-semibold">
            {badge}
          </span>
        )}
      </div>
    </div>
  )
}