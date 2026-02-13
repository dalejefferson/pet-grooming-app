import { useState, useRef, useEffect, useCallback } from 'react'
import usePlacesAutocomplete, { getGeocode } from 'use-places-autocomplete'
import { cn } from '@/lib/utils'
import { MapPin, X, Loader2 } from 'lucide-react'
import { useGoogleMapsLoader } from '@/hooks/useGoogleMapsLoader'

export interface AddressAutocompleteProps {
  label?: string
  error?: string
  helperText?: string
  value: string
  onChange: (value: string) => void
  onSelect?: (address: { formatted: string; placeId: string }) => void
  placeholder?: string
  restrictToCountry?: string
  id?: string
  disabled?: boolean
  required?: boolean
}

export function AddressAutocomplete({
  label,
  error,
  helperText,
  value,
  onChange,
  onSelect,
  placeholder = 'Start typing an address...',
  restrictToCountry = 'us',
  id,
  disabled = false,
  required = false,
}: AddressAutocompleteProps) {
  const { isLoaded, loadError } = useGoogleMapsLoader()
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = id || label?.toLowerCase().replace(/\s/g, '-') || 'address'
  const listboxId = `address-listbox-${inputId}`

  const {
    ready,
    suggestions: { status, data },
    setValue: setPlacesValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: restrictToCountry ? { country: restrictToCountry } : undefined,
      types: ['address'],
    },
    debounce: 300,
    initOnMount: isLoaded,
  })

  // Sync with external value changes without triggering API calls
  const isExternalUpdate = useRef(false)
  useEffect(() => {
    isExternalUpdate.current = true
    setPlacesValue(value, false)
  }, [value, setPlacesValue])

  const hasSuggestions = status === 'OK' && data.length > 0

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        clearSuggestions()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [clearSuggestions])

  // Reset highlighted index when suggestions change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting derived UI state when external suggestions data changes
    setHighlightedIndex(-1)
  }, [data])

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      isExternalUpdate.current = false
      setPlacesValue(newValue)
      onChange(newValue)
      setIsOpen(true)
    },
    [setPlacesValue, onChange],
  )

  const handleSelectSuggestion = useCallback(
    async (suggestion: google.maps.places.AutocompletePrediction) => {
      const description = suggestion.description
      isExternalUpdate.current = true
      setPlacesValue(description, false)
      onChange(description)
      clearSuggestions()
      setIsOpen(false)

      if (onSelect) {
        try {
          await getGeocode({ address: description })
          onSelect({
            formatted: description,
            placeId: suggestion.place_id,
          })
        } catch {
          onSelect({
            formatted: description,
            placeId: suggestion.place_id,
          })
        }
      }
    },
    [setPlacesValue, onChange, onSelect, clearSuggestions],
  )

  const handleClear = useCallback(() => {
    isExternalUpdate.current = true
    setPlacesValue('', false)
    onChange('')
    clearSuggestions()
    setIsOpen(false)
    inputRef.current?.focus()
  }, [setPlacesValue, onChange, clearSuggestions])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        clearSuggestions()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (!isOpen && hasSuggestions) {
          setIsOpen(true)
        } else if (hasSuggestions) {
          setHighlightedIndex((prev) => (prev < data.length - 1 ? prev + 1 : 0))
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        if (isOpen && hasSuggestions) {
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : data.length - 1))
        }
      } else if (e.key === 'Enter' && isOpen && hasSuggestions) {
        e.preventDefault()
        const index = highlightedIndex >= 0 ? highlightedIndex : 0
        handleSelectSuggestion(data[index])
      }
    },
    [isOpen, hasSuggestions, data, highlightedIndex, handleSelectSuggestion, clearSuggestions],
  )

  const getOptionId = (index: number) => `address-option-${inputId}-${index}`
  const highlightedOptionId = highlightedIndex >= 0 ? getOptionId(highlightedIndex) : undefined

  // If Google Maps failed to load, fall back to a plain input
  if (loadError) {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1 block text-sm font-semibold text-[#1e293b]">
            {label}
            {required && <span className="ml-0.5 text-danger-500">*</span>}
          </label>
        )}
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={cn(
            'block w-full rounded-xl border-2 border-[#1e293b] bg-white px-3 py-2 text-[#334155] placeholder-[#94a3b8] transition-all duration-150',
            'focus:border-[#1e293b] focus:outline-none focus:ring-0 focus:shadow-[2px_2px_0px_0px_#1e293b] focus:-translate-y-0.5',
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
            error && 'border-danger-500 focus:border-danger-500 focus:shadow-[2px_2px_0px_0px_#dc2626]',
          )}
        />
        {error && <p className="mt-1 text-sm text-danger-600">{error}</p>}
        {helperText && !error && <p className="mt-1 text-sm text-[#64748b]">{helperText}</p>}
      </div>
    )
  }

  return (
    <div className="w-full" ref={containerRef}>
      {label && (
        <label htmlFor={inputId} className="mb-1 block text-sm font-semibold text-[#1e293b]">
          {label}
          {required && <span className="ml-0.5 text-danger-500">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={isOpen && hasSuggestions}
          aria-controls={listboxId}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          aria-activedescendant={highlightedOptionId}
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            if (hasSuggestions) setIsOpen(true)
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || !ready}
          required={required}
          className={cn(
            'block w-full rounded-xl border-2 border-[#1e293b] bg-white px-3 py-2 pr-16 text-[#334155] placeholder-[#94a3b8] transition-all duration-150',
            'focus:border-[#1e293b] focus:outline-none focus:ring-0 focus:shadow-[2px_2px_0px_0px_#1e293b] focus:-translate-y-0.5',
            'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
            error && 'border-danger-500 focus:border-danger-500 focus:shadow-[2px_2px_0px_0px_#dc2626]',
          )}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {!ready && isLoaded && <Loader2 className="h-4 w-4 animate-spin text-[#64748b]" />}
          {value && ready && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear address"
              className="p-1 text-[#64748b] hover:text-[#334155] rounded cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <MapPin className="h-4 w-4 text-[#64748b]" />
        </div>

        {/* Suggestions dropdown */}
        {isOpen && hasSuggestions && (
          <div
            id={listboxId}
            role="listbox"
            className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border-2 border-[#1e293b] bg-white py-1 shadow-[4px_4px_0px_0px_#1e293b] dropdown-enter"
          >
            {data.map((suggestion, index) => {
              const {
                place_id,
                structured_formatting: { main_text, secondary_text },
              } = suggestion

              return (
                <button
                  key={place_id}
                  id={getOptionId(index)}
                  type="button"
                  role="option"
                  aria-selected={highlightedIndex === index}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onMouseLeave={() => setHighlightedIndex(-1)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                    highlightedIndex === index
                      ? 'bg-[var(--accent-color-light)] text-[#1e293b]'
                      : 'text-[#334155] hover:bg-[var(--accent-color-light)]/50',
                  )}
                >
                  <MapPin className="h-4 w-4 shrink-0 text-[#94a3b8]" />
                  <div className="min-w-0">
                    <span className="font-medium text-[#1e293b]">{main_text}</span>
                    {secondary_text && (
                      <span className="ml-1 text-[#64748b]">{secondary_text}</span>
                    )}
                  </div>
                </button>
              )
            })}
            <div className="border-t border-gray-100 px-3 py-1.5">
              <span className="text-xs text-[#94a3b8]">Powered by Google</span>
            </div>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-danger-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-sm text-[#64748b]">{helperText}</p>}
    </div>
  )
}
