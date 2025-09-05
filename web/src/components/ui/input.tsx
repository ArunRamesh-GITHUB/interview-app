
import * as React from 'react'
import { cn } from '../../lib/utils'
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn('w-full rounded-xl border border-divider bg-card text-text-primary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary', className)} {...props} />
  )
)
Input.displayName = 'Input'
