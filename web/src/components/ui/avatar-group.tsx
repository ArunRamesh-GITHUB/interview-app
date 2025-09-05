import * as React from 'react'
import { cn } from '../../lib/utils'

export interface Avatar {
  src?: string
  alt: string
  fallback?: string
}

export interface AvatarGroupProps {
  avatars: Avatar[]
  size?: 'sm' | 'md'
  max?: number
  className?: string
}

const sizeStyles = {
  sm: { size: 'w-6 h-6', text: 'text-xs', overlap: '-ml-2' },
  md: { size: 'w-7 h-7', text: 'text-sm', overlap: '-ml-2' }
}

export function AvatarGroup({ 
  avatars, 
  size = 'md', 
  max = 4, 
  className 
}: AvatarGroupProps) {
  const styles = sizeStyles[size]
  const visibleAvatars = avatars.slice(0, max)
  const remainingCount = Math.max(0, avatars.length - max)
  
  return (
    <div className={cn('flex items-center', className)}>
      {visibleAvatars.map((avatar, index) => (
        <div
          key={index}
          className={cn(
            'relative rounded-full bg-surface-alt border-2 border-card shadow-level-1 overflow-hidden',
            styles.size,
            index > 0 && styles.overlap
          )}
        >
          {avatar.src ? (
            <img
              src={avatar.src}
              alt={avatar.alt}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-primary text-primary-on font-primary font-semibold">
              <span className={styles.text}>
                {avatar.fallback || avatar.alt.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      ))}
      
      {remainingCount > 0 && (
        <div
          className={cn(
            'relative rounded-full bg-surface-alt border-2 border-card shadow-level-1 flex items-center justify-center',
            'text-text-secondary font-primary font-semibold',
            styles.size,
            styles.text,
            visibleAvatars.length > 0 && styles.overlap
          )}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  )
}