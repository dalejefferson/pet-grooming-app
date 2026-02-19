import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { AlertTriangle } from 'lucide-react'

export interface CancelSubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
  periodEndDate: string | null
  planName: string
}

export function CancelSubscriptionModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  periodEndDate,
  planName,
}: CancelSubscriptionModalProps) {
  const formattedDate = periodEndDate
    ? new Date(periodEndDate).toLocaleDateString()
    : 'the end of your billing period'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cancel Subscription" size="sm">
      <div className="space-y-4">
        {/* Warning alert box */}
        <div className="flex items-start gap-3 rounded-xl border-2 border-[#1e293b] bg-[#fce7f3] px-4 py-3 shadow-[2px_2px_0px_0px_#1e293b]">
          <AlertTriangle className="h-5 w-5 shrink-0 text-[#be123c] mt-0.5" />
          <div className="text-sm text-[#334155]">
            <p className="font-semibold text-[#1e293b]">
              Are you sure you want to cancel your {planName} plan?
            </p>
            <ul className="mt-2 list-disc pl-4 space-y-1 text-[#64748b]">
              <li>You will retain full access until <strong className="text-[#334155]">{formattedDate}</strong></li>
              <li>After that date, your account will be downgraded</li>
              <li>You can resume your subscription at any time before then</li>
            </ul>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={isLoading}
          >
            Keep My Subscription
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={onConfirm}
            loading={isLoading}
          >
            Cancel Subscription
          </Button>
        </div>
      </div>
    </Modal>
  )
}
