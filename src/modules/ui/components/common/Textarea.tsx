import { forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, required, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="mb-1 block text-sm font-semibold text-[#1e293b]"
          >
            {label}
            {required && <span className="ml-0.5 text-red-500" aria-hidden="true">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          required={required}
          className={cn(
            'block w-full rounded-xl border-2 border-[#1e293b] bg-white px-3 py-2 text-[#334155] placeholder-[#94a3b8] transition-all duration-150',
            'focus:border-[#1e293b] focus:outline-none focus:ring-0 focus:shadow-[2px_2px_0px_0px_#1e293b] focus:-translate-y-0.5',
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
            error && 'border-danger-500 focus:border-danger-500 focus:shadow-[2px_2px_0px_0px_#dc2626]',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-danger-600">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-[#64748b]">{helperText}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
