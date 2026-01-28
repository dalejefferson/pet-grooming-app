import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
  accent?: boolean
  colorVariant?: 'white' | 'mint' | 'lemon' | 'lavender' | 'pink' | 'lime' | 'peach'
}

const colorVariants = {
  white: 'bg-white',
  mint: 'bg-[#d1fae5]',
  lemon: 'bg-[#fef9c3]',
  lavender: 'bg-[#e9d5ff]',
  pink: 'bg-[#fce7f3]',
  lime: 'bg-[#ecfccb]',
  peach: 'bg-[#fed7aa]',
}

export function Card({
  children,
  className,
  padding = 'md',
  accent = false,
  colorVariant = 'white',
  ...props
}: CardProps) {
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }

  return (
    <div
      className={cn(
        'rounded-2xl border-2 border-[#1e293b] shadow-[3px_3px_0px_0px_#1e293b]',
        colorVariants[colorVariant],
        paddingStyles[padding],
        accent && 'border-l-4 border-l-accent-500',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-lg font-bold text-[#1e293b]', className)}
      {...props}
    >
      {children}
    </h3>
  )
}

export function CardDescription({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-[#64748b]', className)} {...props}>
      {children}
    </p>
  )
}

export function CardContent({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('mt-4 flex items-center gap-2', className)}
      {...props}
    >
      {children}
    </div>
  )
}
