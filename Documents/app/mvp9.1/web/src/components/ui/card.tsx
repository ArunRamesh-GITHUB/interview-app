
import * as React from 'react'
import { cn } from '../../lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'orange' | 'lavender'
}

const cardVariants = {
  default: 'bg-card border-divider',
  orange: 'bg-card-tinted-orange border-divider',
  lavender: 'bg-card-tinted-lavender border-divider'
}

export function Card({ className, variant = 'default', ...props }: CardProps) {
  return (
    <div 
      className={cn(
        'rounded-xl border shadow-level-1 font-primary hover-lift',
        cardVariants[variant],
        className
      )} 
      {...props} 
    />
  )
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6 border-b border-divider', className)} {...props} />
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-title font-primary text-text-primary', className)} {...props} />
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-6', className)} {...props} />
}
