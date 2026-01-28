import { useState, useRef, useEffect, forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, Check, X } from 'lucide-react'

export interface ComboBoxOption {
  value: string
  label: string
}

export interface ComboBoxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label?: string
  error?: string
  helperText?: string
  options: ComboBoxOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  allowCustomValue?: boolean
}

export const ComboBox = forwardRef<HTMLInputElement, ComboBoxProps>(
  ({
    className,
    label,
    error,
    helperText,
    options,
    value,
    onChange,
    placeholder,
    allowCustomValue = true,
    id,
    ...props
  }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const [inputValue, setInputValue] = useState(value)
    const [filteredOptions, setFilteredOptions] = useState(options)
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const inputId = id || label?.toLowerCase().replace(/\s/g, '-')

    // Sync input value with external value
    useEffect(() => {
      setInputValue(value)
    }, [value])

    // Filter options based on input
    useEffect(() => {
      if (inputValue) {
        const filtered = options.filter(option =>
          option.label.toLowerCase().includes(inputValue.toLowerCase())
        )
        setFilteredOptions(filtered)
      } else {
        setFilteredOptions(options)
      }
    }, [inputValue, options])

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false)
          // If custom value is not allowed and current value is not in options, reset
          if (!allowCustomValue && !options.find(o => o.value === inputValue || o.label === inputValue)) {
            setInputValue(value)
          }
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [allowCustomValue, options, inputValue, value])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setInputValue(newValue)
      setIsOpen(true)

      if (allowCustomValue) {
        onChange(newValue)
      }
    }

    const handleSelectOption = (option: ComboBoxOption) => {
      setInputValue(option.label)
      onChange(option.value)
      setIsOpen(false)
    }

    const handleClear = () => {
      setInputValue('')
      onChange('')
      inputRef.current?.focus()
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setIsOpen(true)
      } else if (e.key === 'Enter' && isOpen && filteredOptions.length > 0) {
        e.preventDefault()
        handleSelectOption(filteredOptions[0])
      }
    }

    const isSelected = (option: ComboBoxOption) => {
      return value === option.value || value === option.label
    }

    return (
      <div className="w-full" ref={containerRef}>
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1 block text-sm font-semibold text-[#1e293b]"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={(node) => {
              // Handle both refs
              (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node
              if (typeof ref === 'function') {
                ref(node)
              } else if (ref) {
                ref.current = node
              }
            }}
            id={inputId}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              'block w-full rounded-xl border-2 border-[#1e293b] bg-white px-3 py-2 pr-16 text-[#334155] placeholder-[#94a3b8] transition-all duration-150',
              'focus:border-[#1e293b] focus:outline-none focus:ring-0 focus:shadow-[2px_2px_0px_0px_#1e293b] focus:-translate-y-0.5',
              'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
              error && 'border-danger-500 focus:border-danger-500 focus:shadow-[2px_2px_0px_0px_#dc2626]',
              className
            )}
            {...props}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {inputValue && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear selection"
                className="p-1 text-gray-500 hover:text-gray-700 rounded cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? 'Close dropdown' : 'Open dropdown'}
              className="p-1 text-gray-500 hover:text-gray-700 rounded cursor-pointer"
            >
              <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
            </button>
          </div>

          {/* Dropdown */}
          {isOpen && (
            <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border-2 border-[#1e293b] bg-white py-1 shadow-[4px_4px_0px_0px_#1e293b]">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelectOption(option)}
                    className={cn(
                      'flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors',
                      isSelected(option)
                        ? 'bg-primary-100 text-primary-900'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <span>{option.label}</span>
                    {isSelected(option) && <Check className="h-4 w-4 text-primary-600" />}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500">
                  {allowCustomValue
                    ? `Use "${inputValue}" as custom value`
                    : 'No options found'}
                </div>
              )}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-danger-600">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-[#64748b]">{helperText}</p>
        )}
      </div>
    )
  }
)

ComboBox.displayName = 'ComboBox'
