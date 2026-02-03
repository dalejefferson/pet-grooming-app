import type { ReactNode } from 'react'
import { Button } from './Button'

export interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-[#1e293b] bg-white px-6 py-12 shadow-[3px_3px_0px_0px_#1e293b]">
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-[#1e293b] bg-gray-50 text-[#64748b]">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-bold text-[#1e293b]">{title}</h3>
      <p className="mt-1 max-w-sm text-center text-sm text-[#64748b]">{description}</p>
      {action && (
        <div className="mt-4">
          <Button variant="primary" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  )
}
