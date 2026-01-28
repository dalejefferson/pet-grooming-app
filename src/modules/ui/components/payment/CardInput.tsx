import { CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  formatCardNumber,
  formatExpirationDate,
  detectCardBrand,
} from '@/lib/utils/cardUtils'
import type { CardBrand } from '@/types'

export interface CardInputValue {
  number: string
  expiry: string
  cvc: string
}

export interface CardInputErrors {
  number?: string
  expiry?: string
  cvc?: string
}

export interface CardInputProps {
  value: CardInputValue
  onChange: (value: CardInputValue) => void
  errors?: CardInputErrors
  disabled?: boolean
}

/**
 * Card brand icon component - displays the detected card brand
 */
function CardBrandIcon({ brand }: { brand: CardBrand }) {
  const brandStyles: Record<CardBrand, { bg: string; text: string; label: string }> = {
    visa: { bg: 'bg-blue-600', text: 'text-white', label: 'VISA' },
    mastercard: { bg: 'bg-orange-500', text: 'text-white', label: 'MC' },
    amex: { bg: 'bg-blue-400', text: 'text-white', label: 'AMEX' },
    discover: { bg: 'bg-orange-600', text: 'text-white', label: 'DISC' },
    unknown: { bg: 'bg-gray-200', text: 'text-gray-600', label: '' },
  }

  const style = brandStyles[brand]

  if (brand === 'unknown') {
    return <CreditCard className="h-5 w-5 text-[#64748b]" />
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded px-1.5 py-0.5 text-xs font-bold',
        style.bg,
        style.text
      )}
    >
      {style.label}
    </span>
  )
}

/**
 * Neo-brutalist card input with auto-formatting and brand detection
 */
export function CardInput({
  value,
  onChange,
  errors,
  disabled = false,
}: CardInputProps) {
  const detectedBrand = detectCardBrand(value.number)

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value)
    onChange({ ...value, number: formatted })
  }

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatExpirationDate(e.target.value)
    onChange({ ...value, expiry: formatted })
  }

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Limit CVC to 3 or 4 digits (4 for Amex)
    const maxLength = detectedBrand === 'amex' ? 4 : 3
    const cleaned = e.target.value.replace(/\D/g, '').slice(0, maxLength)
    onChange({ ...value, cvc: cleaned })
  }

  const inputBaseStyles = cn(
    'block w-full rounded-xl border-2 border-[#1e293b] bg-white px-3 py-2 text-[#334155] placeholder-[#94a3b8] transition-all duration-150',
    'focus:border-[#1e293b] focus:outline-none focus:ring-0 focus:shadow-[2px_2px_0px_0px_#1e293b] focus:-translate-y-0.5',
    'disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500'
  )

  const errorInputStyles = 'border-danger-500 focus:border-danger-500 focus:shadow-[2px_2px_0px_0px_#dc2626]'

  return (
    <div className="space-y-4">
      {/* Card Number */}
      <div>
        <label className="mb-1 block text-sm font-semibold text-[#1e293b]">
          Card Number
        </label>
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="1234 5678 9012 3456"
            value={value.number}
            onChange={handleNumberChange}
            disabled={disabled}
            className={cn(
              inputBaseStyles,
              'pr-16',
              errors?.number && errorInputStyles
            )}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <CardBrandIcon brand={detectedBrand} />
          </div>
        </div>
        {errors?.number && (
          <p className="mt-1 text-sm text-danger-600">{errors.number}</p>
        )}
      </div>

      {/* Expiry and CVC */}
      <div className="grid grid-cols-2 gap-4">
        {/* Expiry */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-[#1e293b]">
            Expiration
          </label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/YY"
            value={value.expiry}
            onChange={handleExpiryChange}
            disabled={disabled}
            maxLength={5}
            className={cn(inputBaseStyles, errors?.expiry && errorInputStyles)}
          />
          {errors?.expiry && (
            <p className="mt-1 text-sm text-danger-600">{errors.expiry}</p>
          )}
        </div>

        {/* CVC */}
        <div>
          <label className="mb-1 block text-sm font-semibold text-[#1e293b]">
            CVC
          </label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder={detectedBrand === 'amex' ? '1234' : '123'}
            value={value.cvc}
            onChange={handleCvcChange}
            disabled={disabled}
            maxLength={detectedBrand === 'amex' ? 4 : 3}
            className={cn(inputBaseStyles, errors?.cvc && errorInputStyles)}
          />
          {errors?.cvc && (
            <p className="mt-1 text-sm text-danger-600">{errors.cvc}</p>
          )}
        </div>
      </div>
    </div>
  )
}
