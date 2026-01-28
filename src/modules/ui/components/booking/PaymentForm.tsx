import { Check, AlertCircle, Lock } from 'lucide-react'
import { Card, CardTitle } from '../common'
import { PaymentMethodSelector, type CardInputValue } from '../payment'
import type { PaymentStatus } from '@/types'

interface PaymentFormProps {
  paymentStatus: PaymentStatus
  clientId?: string | null
  selectedPaymentMethodId?: string | null
  onPaymentMethodSelect?: (id: string | null) => void
  onAddNewCard?: (cardValue: CardInputValue, saveForFuture: boolean) => void
}

export function PaymentForm({
  paymentStatus,
  clientId,
  selectedPaymentMethodId = null,
  onPaymentMethodSelect,
  onAddNewCard,
}: PaymentFormProps) {
  return (
    <Card className="border-[#1e293b] bg-white">
      <CardTitle className="flex items-center gap-2">
        <Lock className="h-5 w-5" />
        Payment
      </CardTitle>
      <p className="mt-1 text-sm text-gray-500">Secure payment processing</p>

      {paymentStatus === 'completed' ? (
        <div className="mt-4 rounded-xl border-2 border-success-500 bg-success-50 p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success-500">
              <Check className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-success-900">Payment Successful!</p>
              <p className="text-sm text-success-700">Your booking is being confirmed...</p>
            </div>
          </div>
        </div>
      ) : paymentStatus === 'failed' ? (
        <div className="mt-4 rounded-xl border-2 border-danger-500 bg-danger-50 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-6 w-6 text-danger-600" />
            <div>
              <p className="font-semibold text-danger-900">Payment Failed</p>
              <p className="text-sm text-danger-700">Please try again or use a different card.</p>
            </div>
          </div>
        </div>
      ) : clientId ? (
        // Show PaymentMethodSelector for logged-in clients
        <div className="mt-4">
          <PaymentMethodSelector
            clientId={clientId}
            selectedId={selectedPaymentMethodId}
            onSelect={onPaymentMethodSelect || (() => {})}
            onAddNew={onAddNewCard}
            showAddNew={true}
          />
        </div>
      ) : (
        // Guest checkout - show new card input only
        <div className="mt-4">
          <PaymentMethodSelector
            clientId=""
            selectedId={null}
            onSelect={() => {}}
            onAddNew={onAddNewCard}
            showAddNew={true}
          />
        </div>
      )}
    </Card>
  )
}
