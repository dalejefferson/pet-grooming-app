import { UserX, XCircle } from 'lucide-react'
import { Modal, Button, Textarea } from '../common'
import { useTheme } from '../../context'
import { cn } from '@/lib/utils'
import type { StatusChangeModalProps } from './types'

/**
 * StatusChangeModal provides a dialog for changing appointment status
 * to no_show or cancelled with optional notes.
 */
export function StatusChangeModal({
  isOpen,
  onClose,
  pendingStatus,
  notes,
  onNotesChange,
  onConfirm,
  isUpdating,
}: StatusChangeModalProps) {
  const { colors } = useTheme()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={pendingStatus === 'no_show' ? 'Mark as No Show' : 'Cancel Appointment'}
      size="md"
    >
      <div className="space-y-4">
        {/* Status Icon and Description */}
        <div className={cn(
          'rounded-xl border-2 p-4',
          pendingStatus === 'no_show'
            ? 'border-[#f472b6] bg-[#fce7f3]'
            : 'border-[#9ca3af] bg-[#e5e7eb]'
        )}>
          <div className="flex items-center gap-3">
            {pendingStatus === 'no_show' ? (
              <UserX className="h-6 w-6 text-[#9d174d]" />
            ) : (
              <XCircle className="h-6 w-6 text-[#374151]" />
            )}
            <div>
              <p className={cn(
                'font-semibold',
                pendingStatus === 'no_show' ? 'text-[#9d174d]' : 'text-[#374151]'
              )}>
                {pendingStatus === 'no_show'
                  ? 'Client did not show up for appointment'
                  : 'Cancel this appointment'}
              </p>
              <p className={cn(
                'text-sm',
                pendingStatus === 'no_show' ? 'text-[#9d174d]/70' : 'text-[#374151]/70'
              )}>
                Add notes to explain what happened (optional)
              </p>
            </div>
          </div>
        </div>

        {/* Notes Textarea */}
        <div>
          <Textarea
            label={pendingStatus === 'no_show' ? 'No Show Notes' : 'Cancellation Notes'}
            placeholder={pendingStatus === 'no_show'
              ? 'e.g., Client did not answer calls, appointment rescheduled...'
              : 'e.g., Client requested cancellation, emergency situation...'}
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={4}
          />
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
            variant={pendingStatus === 'no_show' ? 'primary' : 'outline'}
            className={cn(
              'flex-1 hover:opacity-90',
              pendingStatus === 'cancelled' && 'border-[#374151] bg-[#374151] text-white hover:bg-[#1f2937]'
            )}
            onClick={onConfirm}
            disabled={isUpdating}
            style={pendingStatus === 'no_show' ? { backgroundColor: colors.accentColorDark } : undefined}
          >
            {isUpdating ? 'Updating...' : (pendingStatus === 'no_show' ? 'Mark No Show' : 'Cancel Appointment')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
