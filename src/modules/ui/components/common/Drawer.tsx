import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

export interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  position?: 'left' | 'right'
  size?: 'sm' | 'md' | 'lg'
}

export function Drawer({
  isOpen,
  onClose,
  title,
  children,
  position = 'right',
  size = 'md',
}: DrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleEscape)
    }
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // On mobile, always full width; on larger screens, use specified size
  const sizes = {
    sm: 'w-full sm:max-w-sm',
    md: 'w-full sm:max-w-md',
    lg: 'w-full sm:max-w-lg',
  }

  const positions = {
    left: 'left-0 border-r-2 border-[#1e293b] shadow-[4px_0px_0px_0px_#1e293b]',
    right: 'right-0 sm:border-l-2 sm:border-[#1e293b] sm:shadow-[-4px_0px_0px_0px_#1e293b]',
  }

  const transforms = {
    left: isOpen ? 'translate-x-0' : '-translate-x-full',
    right: isOpen ? 'translate-x-0' : 'translate-x-full',
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-200',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Drawer'}
        className={cn(
          'fixed inset-y-0 z-50 flex flex-col bg-white transition-transform duration-200',
          sizes[size],
          positions[position],
          transforms[position]
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#1e293b] px-4 py-3">
          {title && (
            <h2 className="text-lg font-bold text-[#1e293b]">{title}</h2>
          )}
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close" className="ml-auto">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </>
  )
}
