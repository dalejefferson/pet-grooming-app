import { cn } from '@/lib/utils'

export interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
  id?: string
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
}: ToggleProps) {
  const toggleId = id || label?.toLowerCase().replace(/\s/g, '-')

  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        id={toggleId}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-xl border-2 border-[#1e293b] shadow-[2px_2px_0px_0px_#1e293b] transition-colors duration-100 focus:outline-none focus:ring-2 focus:ring-[#1e293b] focus:ring-offset-2',
          checked ? 'bg-primary-500' : 'bg-[#e2e8f0]',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 transform rounded-md border border-[#1e293b] bg-white shadow ring-0 transition duration-100',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
      {(label || description) && (
        <div className="flex-1">
          {label && (
            <label
              htmlFor={toggleId}
              className={cn(
                'text-sm font-medium text-[#1e293b]',
                disabled && 'text-[#64748b]'
              )}
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-sm text-[#64748b]">{description}</p>
          )}
        </div>
      )}
    </div>
  )
}
