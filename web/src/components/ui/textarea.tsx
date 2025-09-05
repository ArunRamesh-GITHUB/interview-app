
import * as React from 'react'
import { cn } from '../../lib/utils'
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn('w-full rounded-xl border border-divider bg-card text-text-primary px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary min-h-[120px]', className)} {...props} />
  )
)
Textarea.displayName = 'Textarea'
