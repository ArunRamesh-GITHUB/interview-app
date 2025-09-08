import * as React from 'react'
import { cn } from '../../lib/utils'
import { useTokenBalance } from '../../lib/useTokenBalance'
import { formatTabularNumber } from '../../lib/tokens'

export interface TokenBalanceProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'compact' | 'full'
  showLabel?: boolean
  clickable?: boolean
}

const TokenIcon = () => (
  <svg 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    className="w-4 h-4"
  >
    <circle cx="12" cy="12" r="10"/>
    <path d="m15 9-6 6"/>
    <path d="m9 9 6 6"/>
  </svg>
)

export function TokenBalance({ 
  className,
  variant = 'compact',
  showLabel = true,
  clickable = false,
  onClick,
  ...props 
}: TokenBalanceProps) {
  const { balance, loading, error } = useTokenBalance()

  if (loading) {
    return (
      <div className={cn(
        'flex items-center gap-1.5 text-sm text-text-secondary',
        className
      )}>
        <div className="w-4 h-4 rounded-full bg-surface-alt animate-pulse" />
        {showLabel && <span>Loading...</span>}
      </div>
    )
  }

  if (error && balance === 0) {
    return null // Hide on error to not clutter UI
  }

  const formattedBalance = formatTabularNumber(balance, { 
    notation: variant === 'compact' ? 'compact' : 'standard'
  })

  const isClickable = clickable && onClick
  const Component = isClickable ? 'button' : 'div'

  if (variant === 'full') {
    return (
      <Component
        className={cn(
          'flex items-center gap-2 bg-card border border-divider rounded-lg px-3 py-2 shadow-sm',
          isClickable && 'hover:bg-surface-alt cursor-pointer transition-colors',
          className
        )}
        onClick={onClick}
        {...props}
      >
        <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
          <TokenIcon />
        </div>
        <div className="flex flex-col">
          <div className="font-numeric font-bold text-text-primary">
            {formattedBalance}
          </div>
          {showLabel && (
            <div className="text-xs text-text-secondary font-medium">
              Tokens
            </div>
          )}
        </div>
      </Component>
    )
  }

  return (
    <Component
      className={cn(
        'flex items-center gap-1.5 text-sm font-medium',
        balance > 0 ? 'text-text-primary' : 'text-text-secondary',
        isClickable && 'hover:text-primary cursor-pointer transition-colors',
        className
      )}
      onClick={onClick}
      {...props}
    >
      <TokenIcon />
      <span className="font-numeric">
        {formattedBalance}
      </span>
      {showLabel && balance !== 1 && <span>tokens</span>}
      {showLabel && balance === 1 && <span>token</span>}
    </Component>
  )
}