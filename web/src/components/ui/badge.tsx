// web/src/components/ui/badge.tsx
import * as React from 'react'

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

/**
 * Minimal, dependency-free Badge with variant support.
 * Backwards compatible with plain <span {...props} /> usage.
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'default', className = '', ...props }, ref) => {
    const base =
      'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium select-none'
    const stylesByVariant: Record<BadgeVariant, string> = {
      default:
        'border-transparent bg-primary text-primary-on',
      secondary:
        'border-transparent bg-surface-alt text-text-primary',
      destructive:
        'border-transparent bg-error text-white',
      outline:
        'border-border text-text-primary',
    }

    const classes = `${base} ${stylesByVariant[variant]} ${className}`

    return <span ref={ref} className={classes} {...props} />
  }
)

Badge.displayName = 'Badge'
