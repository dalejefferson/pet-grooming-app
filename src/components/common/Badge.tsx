import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
  variant?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'danger'
    | 'outline'
  size?: 'sm' | 'md'
}

export function Badge({
  children,
  className,
  variant = 'default',
  size = 'md',
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-[#f1f5f9] text-[#334155] border-2 border-[#1e293b]',
    primary: 'bg-[#d1fae5] text-[#1e293b] border-2 border-[#1e293b]', // mint
    secondary: 'bg-[#fef9c3] text-[#334155] border-2 border-[#1e293b]', // lemon
    success: 'bg-[#d1fae5] text-[#166534] border-2 border-[#1e293b]',
    warning: 'bg-[#fef9c3] text-[#a16207] border-2 border-[#1e293b]',
    danger: 'bg-[#fce7f3] text-[#be123c] border-2 border-[#1e293b]', // pink
    outline: 'bg-white text-[#334155] border-2 border-[#1e293b]',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg font-semibold shadow-[2px_2px_0px_0px_#1e293b]',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
