import { AlertTriangle } from 'lucide-react'
import { Modal, Button } from '@/components/common'

export interface DeleteVaccinationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  isDeleting: boolean
}

export function DeleteVaccinationModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteVaccinationModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Vaccination Record"
      size="sm"
    >
      <div className="space-y-4">
        <div className="rounded-xl bg-[#fef2f2] border-2 border-[#fecaca] p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-[#fee2e2] p-2">
              <AlertTriangle className="h-5 w-5 text-[#ef4444]" />
            </div>
            <div>
              <p className="font-semibold text-[#1e293b]">Are you sure?</p>
              <p className="mt-1 text-sm text-[#64748b]">
                This action cannot be undone. The vaccination record will be permanently removed.
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={onConfirm}
            loading={isDeleting}
          >
            Delete Record
          </Button>
        </div>
      </div>
    </Modal>
  )
}
