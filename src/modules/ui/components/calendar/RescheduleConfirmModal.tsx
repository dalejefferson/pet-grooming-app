import { format } from 'date-fns'
import { AlertTriangle } from 'lucide-react'
import { Modal, Button } from '../common'
import { useTheme } from '../../context'
import type { RescheduleConfirmModalProps } from './types'

/**
 * RescheduleConfirmModal displays a confirmation dialog when an appointment
 * is being moved or resized via drag and drop.
 */
export function RescheduleConfirmModal({
  isOpen,
  onClose,
  pendingMove,
  onConfirm,
  isUpdating,
}: RescheduleConfirmModalProps) {
  const { colors } = useTheme()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={pendingMove?.isResize ? 'Change Appointment Duration?' : 'Reschedule Appointment?'}
      size="md"
    >
      {pendingMove && (
        <div className="space-y-4">
          {/* Client Info */}
          <div className="rounded-xl border-2 border-[#1e293b] bg-[#f0fdf4] p-4">
            <p className="font-semibold text-[#1e293b]">{pendingMove.event.clientName}</p>
            <p className="text-sm text-[#64748b]">{pendingMove.event.petNames}</p>
          </div>

          {/* Time Comparison */}
          <div className="grid grid-cols-2 gap-4">
            {/* Old Time */}
            <div className="rounded-xl border-2 border-[#1e293b] bg-[#f9fafb] p-3">
              <p className="mb-1 text-xs font-semibold text-[#64748b] uppercase">Current Time</p>
              <p className="text-sm font-medium text-[#1e293b]">
                {format(pendingMove.event.start, 'MMM d, yyyy')}
              </p>
              <p className="text-sm text-[#64748b]">
                {format(pendingMove.event.start, 'h:mm a')} - {format(pendingMove.event.end, 'h:mm a')}
              </p>
            </div>

            {/* New Time */}
            <div className="rounded-xl border-2 border-primary-500 bg-[#ecfccb] p-3">
              <p className="mb-1 text-xs font-semibold text-primary-600 uppercase">New Time</p>
              <p className="text-sm font-medium text-[#1e293b]">
                {format(pendingMove.start, 'MMM d, yyyy')}
              </p>
              <p className="text-sm text-[#64748b]">
                {format(pendingMove.start, 'h:mm a')} - {format(pendingMove.end, 'h:mm a')}
              </p>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 rounded-xl border-2 border-[#fbbf24] bg-[#fef9c3] p-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-[#d97706]" />
            <p className="text-sm text-[#92400e]">
              This will update the appointment time. Remember to notify the client of this change.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              className="flex-1 hover:opacity-90"
              onClick={onConfirm}
              disabled={isUpdating}
              style={{ backgroundColor: colors.accentColorDark, color: colors.textOnAccent }}
            >
              {isUpdating ? 'Updating...' : 'Confirm'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
