import { forwardRef, type ButtonHTMLAttributes, type CSSProperties } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent' | 'themed'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      children,
      style,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-xl border-2 border-[#1e293b] shadow-[3px_3px_0px_0px_#1e293b] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#1e293b] active:translate-y-0 active:shadow-[1px_1px_0px_0px_#1e293b] focus:outline-none focus:ring-2 focus:ring-[#1e293b] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
      primary: 'bg-primary-500 text-white hover:bg-primary-600',
      secondary: 'hover:brightness-95', // Theme-aware via CSS variable
      outline: 'bg-white text-[#334155] hover:bg-[var(--accent-color-light)]',
      ghost: 'bg-transparent text-[#334155] border-transparent shadow-none hover:border-[#1e293b] hover:bg-[var(--accent-color-light)] hover:shadow-[3px_3px_0px_0px_#1e293b]',
      danger: 'bg-danger-500 text-white hover:bg-danger-600',
      accent: 'bg-accent-500 text-white hover:bg-accent-600',
      themed: '', // Text color via CSS variable, background via inline style
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    }

    // For themed and secondary variants, use CSS variables for dynamic theme colors
    const getVariantStyles = (): CSSProperties | undefined => {
      if (variant === 'themed') {
        return {
          backgroundColor: 'var(--accent-color)',
          color: 'var(--text-on-primary)',
          '--hover-bg': 'var(--accent-color-dark)',
          ...style,
        } as CSSProperties
      }
      if (variant === 'secondary') {
        return {
          backgroundColor: 'var(--secondary-accent)',
          color: 'var(--text-on-secondary)',
          ...style,
        } as CSSProperties
      }
      return style
    }
    const computedStyles = getVariantStyles()

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          variant === 'themed' && 'hover:brightness-95 active:brightness-90',
          className
        )}
        style={computedStyles}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
