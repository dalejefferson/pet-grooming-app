import { useState, useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/modules/ui/hooks/useToast'
import { Modal } from './Modal'
import { Button } from './Button'

export interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'primary'
  isLoading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading: externalLoading,
}: ConfirmDialogProps) {
  const { showError } = useToast()
  const [internalLoading, setInternalLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const isLoading = externalLoading || internalLoading

  useEffect(() => {
    if (isOpen) {
      setIsReady(false)
      const timer = setTimeout(() => setIsReady(true), 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const handleConfirm = async () => {
    try {
      setInternalLoading(true)
      await onConfirm()
    } catch (error) {
      console.error('Confirm action failed:', error)
      showError(error instanceof Error ? error.message : 'Action failed. Please try again.')
    } finally {
      setInternalLoading(false)
    }
  }

  const buttonVariant =
    variant === 'danger' ? 'danger' : variant === 'warning' ? 'accent' : 'primary'

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        {variant !== 'primary' && (
          <div className="flex items-start gap-3">
            <AlertTriangle
              className={cn(
                'h-5 w-5 mt-0.5 shrink-0',
                variant === 'danger' ? 'text-red-500' : 'text-amber-500'
              )}
            />
            <p className="text-sm text-[#64748b]">{message}</p>
          </div>
        )}
        {variant === 'primary' && (
          <p className="text-sm text-[#64748b]">{message}</p>
        )}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
          <Button variant={buttonVariant} onClick={handleConfirm} loading={isLoading} disabled={!isReady || isLoading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
