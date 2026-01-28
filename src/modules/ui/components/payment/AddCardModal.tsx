import { useState } from 'react'
import { CreditCard, AlertCircle } from 'lucide-react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { Toggle } from '../common/Toggle'
import { CardInput, type CardInputValue, type CardInputErrors } from './CardInput'
import { useAddPaymentMethod } from '@/modules/database/hooks'
import { validateCard } from '@/lib/utils/cardUtils'

export interface AddCardModalProps {
  isOpen: boolean
  onClose: () => void
  clientId: string
}

/**
 * Modal for adding a new payment method
 */
export function AddCardModal({ isOpen, onClose, clientId }: AddCardModalProps) {
  const [cardValue, setCardValue] = useState<CardInputValue>({
    number: '',
    expiry: '',
    cvc: '',
  })
  const [errors, setErrors] = useState<CardInputErrors>({})
  const [setAsDefault, setSetAsDefault] = useState(false)

  const addPaymentMethod = useAddPaymentMethod()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate card
    const validation = validateCard(cardValue.number, cardValue.expiry, cardValue.cvc)

    if (!validation.isValid) {
      setErrors({
        number: validation.errors.cardNumber,
        expiry: validation.errors.expiry,
        cvc: validation.errors.cvc,
      })
      return
    }

    setErrors({})

    try {
      await addPaymentMethod.mutateAsync({
        clientId,
        cardDetails: {
          number: cardValue.number,
          expiry: cardValue.expiry,
          cvc: cardValue.cvc,
        },
      })

      // Reset form and close modal
      setCardValue({ number: '', expiry: '', cvc: '' })
      setSetAsDefault(false)
      onClose()
    } catch (error) {
      // Handle error from mutation
      setErrors({
        number: error instanceof Error ? error.message : 'Failed to add card',
      })
    }
  }

  const handleClose = () => {
    // Reset form state
    setCardValue({ number: '', expiry: '', cvc: '' })
    setErrors({})
    setSetAsDefault(false)
    addPaymentMethod.reset()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Payment Method" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card Icon Header */}
        <div className="flex items-center gap-3 rounded-xl border-2 border-[#1e293b] bg-[#d1fae5] p-3">
          <CreditCard className="h-6 w-6 text-[#1e293b]" />
          <div>
            <p className="font-semibold text-[#1e293b]">Add a New Card</p>
            <p className="text-sm text-[#64748b]">
              Your card information is securely processed
            </p>
          </div>
        </div>

        {/* Card Input */}
        <CardInput
          value={cardValue}
          onChange={setCardValue}
          errors={errors}
          disabled={addPaymentMethod.isPending}
        />

        {/* Set as Default Toggle */}
        <Toggle
          checked={setAsDefault}
          onChange={setSetAsDefault}
          label="Set as default payment method"
          description="This card will be used for future payments"
          disabled={addPaymentMethod.isPending}
        />

        {/* Error Message */}
        {addPaymentMethod.isError && (
          <div className="flex items-center gap-2 rounded-xl border-2 border-danger-500 bg-[#fce7f3] p-3 text-danger-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">
              {addPaymentMethod.error instanceof Error
                ? addPaymentMethod.error.message
                : 'Failed to add payment method'}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={addPaymentMethod.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={addPaymentMethod.isPending}
          >
            Save Card
          </Button>
        </div>
      </form>
    </Modal>
  )
}
