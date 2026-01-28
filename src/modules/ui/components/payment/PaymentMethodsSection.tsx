import { useState } from 'react'
import { CreditCard, Plus, AlertCircle } from 'lucide-react'
import {
  useClientPaymentMethods,
  useSetDefaultPaymentMethod,
  useDeletePaymentMethod,
} from '@/modules/database/hooks'
import { Button } from '../common/Button'
import { Card, CardHeader, CardTitle, CardDescription } from '../common/Card'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { SavedCardItem } from './SavedCardItem'
import { AddCardModal } from './AddCardModal'

export interface PaymentMethodsSectionProps {
  clientId: string
}

/**
 * Payment methods section with list of saved cards and add button
 */
export function PaymentMethodsSection({ clientId }: PaymentMethodsSectionProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  const { data: paymentMethods, isLoading, error } = useClientPaymentMethods(clientId)
  const setDefaultMutation = useSetDefaultPaymentMethod()
  const deleteMutation = useDeletePaymentMethod()

  const handleSetDefault = (paymentMethodId: string) => {
    setDefaultMutation.mutate({ clientId, paymentMethodId })
  }

  const handleDelete = (paymentMethodId: string) => {
    deleteMutation.mutate({ paymentMethodId, clientId })
  }

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
        </CardHeader>
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" />
        </div>
      </Card>
    )
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
        </CardHeader>
        <div className="flex items-center gap-2 rounded-xl border-2 border-danger-500 bg-[#fce7f3] p-4 text-danger-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">Failed to load payment methods</p>
        </div>
      </Card>
    )
  }

  const hasPaymentMethods = paymentMethods && paymentMethods.length > 0

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>
                Manage saved cards for this client
              </CardDescription>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Card
            </Button>
          </div>
        </CardHeader>

        {/* Payment Methods List */}
        {hasPaymentMethods ? (
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <SavedCardItem
                key={method.id}
                paymentMethod={method}
                isDefault={method.isDefault}
                onSetDefault={() => handleSetDefault(method.id)}
                onDelete={() => handleDelete(method.id)}
                disabled={
                  setDefaultMutation.isPending || deleteMutation.isPending
                }
              />
            ))}
          </div>
        ) : (
          // Empty State
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#1e293b] bg-[#fafaf8] p-8 text-center">
            <div className="mb-4 rounded-full border-2 border-[#1e293b] bg-[#d1fae5] p-3">
              <CreditCard className="h-6 w-6 text-[#1e293b]" />
            </div>
            <h3 className="font-semibold text-[#1e293b]">No Payment Methods</h3>
            <p className="mt-1 text-sm text-[#64748b]">
              Add a card to enable quick payments
            </p>
            <Button
              variant="primary"
              size="sm"
              className="mt-4"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus className="mr-1 h-4 w-4" />
              Add Payment Method
            </Button>
          </div>
        )}

        {/* Mutation Error Display */}
        {(setDefaultMutation.isError || deleteMutation.isError) && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border-2 border-danger-500 bg-[#fce7f3] p-3 text-danger-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">
              {setDefaultMutation.error instanceof Error
                ? setDefaultMutation.error.message
                : deleteMutation.error instanceof Error
                  ? deleteMutation.error.message
                  : 'An error occurred'}
            </p>
          </div>
        )}
      </Card>

      {/* Add Card Modal */}
      <AddCardModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        clientId={clientId}
      />
    </>
  )
}
