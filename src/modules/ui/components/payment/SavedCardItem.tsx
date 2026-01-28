import { useState } from 'react'
import { Trash2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getCardBrandName, isCardExpired } from '@/lib/utils/cardUtils'
import type { PaymentMethod, CardBrand } from '@/types'
import { Button } from '../common/Button'
import { Badge } from '../common/Badge'

export interface SavedCardItemProps {
  paymentMethod: PaymentMethod
  isDefault: boolean
  onSetDefault: () => void
  onDelete: () => void
  disabled?: boolean
}

/**
 * Card brand icon for saved cards
 */
function SavedCardBrandIcon({ brand }: { brand: CardBrand }) {
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
        'inline-flex items-center justify-center rounded px-2 py-1 text-xs font-bold',
        style.bg,
        style.text
      )}
    >
      {style.label}
    </span>
  )
}

/**
 * Neo-brutalist saved card display with actions
 */
export function SavedCardItem({
  paymentMethod,
  isDefault,
  onSetDefault,
  onDelete,
  disabled = false,
}: SavedCardItemProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { card } = paymentMethod
  const expired = isCardExpired(card.expMonth, card.expYear)
  const brandName = getCardBrandName(card.brand)

  const handleDeleteClick = () => {
    if (showDeleteConfirm) {
      onDelete()
      setShowDeleteConfirm(false)
    } else {
      setShowDeleteConfirm(true)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false)
  }

  return (
    <div
      className={cn(
        'rounded-xl border-2 border-[#1e293b] bg-white p-4 shadow-[3px_3px_0px_0px_#1e293b] transition-all',
        isDefault && 'bg-[#d1fae5]',
        expired && 'bg-[#fef9c3] border-amber-500',
        disabled && 'opacity-50'
      )}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Card Info */}
        <div className="flex items-center gap-3">
          <SavedCardBrandIcon brand={card.brand} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#1e293b]">
                {brandName} ending in {card.last4}
              </span>
              {isDefault && (
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
            <p className="text-sm text-[#64748b]">
              Expires {String(card.expMonth).padStart(2, '0')}/{String(card.expYear).slice(-2)}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {!isDefault && !expired && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSetDefault}
              disabled={disabled}
            >
              <Check className="mr-1 h-4 w-4" />
              Set Default
            </Button>
          )}

          {showDeleteConfirm ? (
            <div className="flex items-center gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteClick}
                disabled={disabled}
              >
                Confirm
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelDelete}
                disabled={disabled}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteClick}
              disabled={disabled}
              className="text-[#64748b] hover:text-danger-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
