import * as React from 'react'
import { cn } from '../../lib/utils'
import { useTheme } from './ThemeProvider'
import { Sun, Moon, Monitor } from 'lucide-react'

export interface ThemeToggleProps {
  className?: string
  showLabel?: boolean
}

export function ThemeToggle({ className, showLabel = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={cn('w-10 h-10 rounded-lg bg-surface-alt animate-pulse', className)} />
    )
  }

  const themes = [
    { value: 'light', icon: Sun, label: 'Light' },
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' }
  ] as const

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showLabel && (
        <span className="text-label font-semibold text-text-secondary">
          Theme
        </span>
      )}
      
      <div className="flex bg-surface-alt rounded-pill p-1 shadow-level-1">
        {themes.map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-pill transition-all duration-fast',
              'hover:scale-105 active:scale-95',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4F46E5] focus-visible:outline-offset-2',
              theme === value 
                ? 'bg-primary text-primary-on shadow-level-1' 
                : 'text-text-secondary hover:text-text-primary hover:bg-border/50'
            )}
            title={`Switch to ${label.toLowerCase()} theme`}
            aria-label={`Switch to ${label.toLowerCase()} theme`}
          >
            <Icon size={16} />
          </button>
        ))}
      </div>
    </div>
  )
}

export function ThemeToggleButton({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className={cn('w-10 h-10 rounded-lg bg-surface-alt animate-pulse', className)} />
    )
  }

  const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor

  return (
    <button
      onClick={() => setTheme(nextTheme)}
      className={cn(
        'flex items-center justify-center w-10 h-10 rounded-lg bg-surface-alt text-text-primary',
        'hover:bg-border hover:scale-105 active:scale-95 transition-all duration-fast',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4F46E5] focus-visible:outline-offset-2',
        'shadow-level-1 hover:shadow-level-2',
        className
      )}
      title={`Switch to ${nextTheme} theme`}
      aria-label={`Current theme: ${theme}. Click to switch to ${nextTheme}`}
    >
      <Icon size={20} />
    </button>
  )
}