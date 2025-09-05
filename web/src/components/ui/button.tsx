import * as React from 'react'
import { cn } from '../../lib/utils'

export type ButtonVariant =
  | 'default'
  | 'primary'
  | 'secondary' 
  | 'outline'
  | 'ghost'
  | 'destructive'

export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const base =
  'inline-flex items-center justify-center font-primary font-semibold button-enhanced focus-ring-enhanced ' +
  'disabled:opacity-50 disabled:pointer-events-none border-0'

const sizes: Record<ButtonSize, string> = {
  sm: 'rounded-lg px-4 py-2 text-label min-h-[44px]',
  md: 'rounded-xl px-6 py-3 text-subtitle min-h-[44px]', 
  lg: 'rounded-xl px-8 py-4 text-title min-h-[48px]'
}

const variants: Record<ButtonVariant, string> = {
  default: 'bg-primary text-primary-on shadow-level-1',
  primary: 'bg-primary text-primary-on shadow-level-1',
  secondary: 'bg-secondary text-secondary-on shadow-level-1',
  outline: 'border border-border bg-card text-text-primary hover:bg-surface-alt',
  ghost: 'bg-transparent text-text-primary hover:bg-surface-alt',
  destructive: 'bg-error text-card shadow-level-1',
}

function ButtonImpl(
  { className, variant = 'default', size = 'md', ...props }: ButtonProps,
  ref: React.Ref<HTMLButtonElement>
) {
  const v: ButtonVariant = variant ?? 'default'
  const s: ButtonSize = size ?? 'md'
  return (
    <button
      ref={ref}
      className={cn(base, sizes[s], variants[v], className)}
      {...props}
    />
  )
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(ButtonImpl)
Button.displayName = 'Button'
