import { useState } from 'react'
import { CreditCard, Plus, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getCardBrandName, isCardExpired } from '@/lib/utils/cardUtils'
import { useClientPaymentMethods } from '@/modules/database/hooks'
import type { PaymentMethod, CardBrand } from '@/types'
import { Button } from '../common/Button'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { Badge } from '../common/Badge'
import { CardInput, type CardInputValue, type CardInputErrors } from './CardInput'
import { validateCard } from '@/lib/utils/cardUtils'

export interface PaymentMethodSelectorProps {
  clientId: string
  selectedId: string | null
  onSelect: (id: string | null) => void
  onAddNew?: (cardValue: CardInputValue, saveForFuture: boolean) => void
  showAddNew?: boolean
}

/**
 * Small card brand indicator
 */
function SmallCardBrand({ brand }: { brand: CardBrand }) {
  const brandStyles: Record<CardBrand, { bg: string; text: string; label: string }> = {
    visa: { bg: 'bg-blue-600', text: 'text-white', label: 'VISA' },
    mastercard: { bg: 'bg-orange-500', text: 'text-white', label: 'MC' },
    amex: { bg: 'bg-blue-400', text: 'text-white', label: 'AMEX' },
    discover: { bg: 'bg-orange-600', text: 'text-white', label: 'DISC' },
    unknown: { bg: 'bg-gray-200', text: 'text-gray-600', label: 'CARD' },
  }

  const style = brandStyles[brand]

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-bold',
        style.bg,
        style.text
      )}
    >
      {style.label}
    </span>
  )
}

/**
 * Radio option for a saved payment method
 */
function PaymentMethodOption({
  method,
  isSelected,
  onSelect,
  disabled,
}: {
  method: PaymentMethod
  isSelected: boolean
  onSelect: () => void
  disabled?: boolean
}) {
  const { card } = method
  const expired = isCardExpired(card.expMonth, card.expYear)
  const brandName = getCardBrandName(card.brand)

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled || expired}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl border-2 border-[#1e293b] p-3 text-left transition-all',
        isSelected
          ? 'bg-[#d1fae5] shadow-[3px_3px_0px_0px_#1e293b]'
          : 'bg-white hover:bg-[#fafaf8] shadow-[2px_2px_0px_0px_#1e293b]',
        expired && 'opacity-50 cursor-not-allowed bg-[#fef9c3]',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {/* Radio Indicator */}
      <div
        className={cn(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-[#1e293b]',
          isSelected ? 'bg-primary-500' : 'bg-white'
        )}
      >
        {isSelected && <Check className="h-3 w-3 text-white" />}
      </div>

      {/* Card Info */}
      <div className="flex flex-1 items-center gap-2">
        <SmallCardBrand brand={card.brand} />
        <span className="font-medium text-[#1e293b]">
          {brandName} ****{card.last4}
        </span>
        <span className="text-sm text-[#64748b]">
          {String(card.expMonth).padStart(2, '0')}/{String(card.expYear).slice(-2)}
        </span>
        {method.isDefault && (
          <Badge variant="success" size="sm">
            Default
          </Badge>
        )}
        {expired && (
          <Badge variant="warning" size="sm">
            Expired
          </Badge>
        )}
      </div>
    </button>
  )
}

/**
 * Payment method selector with radio group and optional new card input
 */
export function PaymentMethodSelector({
  clientId,
  selectedId,
  onSelect,
  onAddNew,
  showAddNew = true,
}: PaymentMethodSelectorProps) {
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newCardValue, setNewCardValue] = useState<CardInputValue>({
    number: '',
    expiry: '',
    cvc: '',
  })
  const [newCardErrors, setNewCardErrors] = useState<CardInputErrors>({})
  const [saveForFuture, setSaveForFuture] = useState(true)

  const { data: paymentMethods, isLoading } = useClientPaymentMethods(clientId)

  const handleSelectSaved = (id: string) => {
    setIsAddingNew(false)
    onSelect(id)
  }

  const handleSelectAddNew = () => {
    setIsAddingNew(true)
    onSelect(null)
  }

  const handleNewCardChange = (value: CardInputValue) => {
    setNewCardValue(value)
    setNewCardErrors({})
  }

  const handleConfirmNewCard = () => {
    // Validate card
    const validation = validateCard(
      newCardValue.number,
      newCardValue.expiry,
      newCardValue.cvc
    )

    if (!validation.isValid) {
      setNewCardErrors({
        number: validation.errors.cardNumber,
        expiry: validation.errors.expiry,
        cvc: validation.errors.cvc,
      })
      return
    }

    if (onAddNew) {
      onAddNew(newCardValue, saveForFuture)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="md" />
      </div>
    )
  }

  const hasPaymentMethods = paymentMethods && paymentMethods.length > 0

  return (
    <div className="space-y-3">
      {/* Saved Payment Methods */}
      {hasPaymentMethods &&
        paymentMethods.map((method) => (
          <PaymentMethodOption
            key={method.id}
            method={method}
            isSelected={selectedId === method.id && !isAddingNew}
            onSelect={() => handleSelectSaved(method.id)}
          />
        ))}

      {/* Add New Card Option */}
      {showAddNew && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleSelectAddNew}
            className={cn(
              'flex w-full items-center gap-3 rounded-xl border-2 border-[#1e293b] p-3 text-left transition-all',
              isAddingNew
                ? 'bg-[#d1fae5] shadow-[3px_3px_0px_0px_#1e293b]'
                : 'bg-white hover:bg-[#fafaf8] shadow-[2px_2px_0px_0px_#1e293b]'
            )}
          >
            {/* Radio Indicator */}
            <div
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-[#1e293b]',
                isAddingNew ? 'bg-primary-500' : 'bg-white'
              )}
            >
              {isAddingNew && <Check className="h-3 w-3 text-white" />}
            </div>

            {/* Add New Label */}
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-[#1e293b]" />
              <span className="font-medium text-[#1e293b]">Add new card</span>
            </div>
          </button>

          {/* New Card Input (shown when adding new) */}
          {isAddingNew && (
            <div className="ml-8 space-y-4 rounded-xl border-2 border-[#1e293b] bg-white p-4 shadow-[2px_2px_0px_0px_#1e293b]">
              <CardInput
                value={newCardValue}
                onChange={handleNewCardChange}
                errors={newCardErrors}
              />

              {/* Save for Future Checkbox */}
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={saveForFuture}
                  onChange={(e) => setSaveForFuture(e.target.checked)}
                  className="h-4 w-4 rounded border-2 border-[#1e293b] text-primary-500 focus:ring-[#1e293b]"
                />
                <span className="text-sm text-[#334155]">
                  Save card for future use
                </span>
              </label>

              {/* Confirm Button */}
              {onAddNew && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleConfirmNewCard}
                >
                  Use this card
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty State - No saved cards and not showing add new */}
      {!hasPaymentMethods && !showAddNew && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#1e293b] bg-[#fafaf8] p-6 text-center">
          <CreditCard className="mb-2 h-8 w-8 text-[#64748b]" />
          <p className="text-sm text-[#64748b]">No saved payment methods</p>
        </div>
      )}
    </div>
  )
}
