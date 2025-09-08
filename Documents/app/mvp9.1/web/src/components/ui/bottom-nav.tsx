import * as React from 'react'
import { cn } from '../../lib/utils'

export interface BottomNavItem {
  id: string
  icon: React.ReactNode
  label?: string
  badge?: boolean
  href?: string
  onClick?: () => void
}

export interface BottomNavProps {
  items: BottomNavItem[]
  activeId?: string
  className?: string
}

export function BottomNav({ items, activeId, className }: BottomNavProps) {
  // Limit to max 7 items for better functionality
  const navItems = items.slice(0, 7)
  
  return (
    <nav 
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 md:hidden',
        'h-18 bg-card shadow-level-2 rounded-t-xl border-t border-divider',
        'font-primary pb-safe',
        className
      )}
      role="navigation"
    >
      <div className="flex items-center justify-around h-full px-4">
        {navItems.map((item) => {
          const isActive = activeId === item.id
          const Component = item.href ? 'a' : 'button'
          
          return (
            <Component
              key={item.id}
              href={item.href}
              onClick={item.onClick}
              className={cn(
                'relative flex items-center justify-center gap-2 px-3 py-2 rounded-pill transition-all duration-fast',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4F46E5] focus-visible:outline-offset-2',
                'min-h-[44px] min-w-[44px]',
                isActive 
                  ? 'bg-surface-alt shadow-level-1' 
                  : 'hover:bg-surface-alt hover:scale-105'
              )}
            >
              {/* Icon */}
              <div className={cn(
                'flex items-center justify-center w-6 h-6 transition-colors duration-fast',
                isActive ? 'text-primary' : 'text-text-secondary'
              )}>
                {item.icon}
              </div>
              
              {/* Label (only shown when active) */}
              {isActive && item.label && (
                <span className="text-label font-semibold text-text-primary">
                  {item.label}
                </span>
              )}
              
              {/* Badge dot */}
              {item.badge && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-error rounded-full" />
              )}
            </Component>
          )
        })}
      </div>
    </nav>
  )
}