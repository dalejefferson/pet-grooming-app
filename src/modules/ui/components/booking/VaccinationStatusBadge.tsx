import { Shield, AlertTriangle, Clock, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getVaccinationStatusColor,
  getVaccinationStatusLabel,
} from '@/lib/utils/vaccinationUtils'
import type { VaccinationStatus } from '@/types'

export interface VaccinationStatusBadgeProps {
  status: VaccinationStatus
  size?: 'sm' | 'md'
}

/**
 * Get the appropriate icon for each vaccination status
 */
function getStatusIcon(status: VaccinationStatus, sizeClass: string) {
  const iconProps = { className: sizeClass }

  switch (status) {
    case 'expired':
      return <AlertTriangle {...iconProps} />
    case 'expiring_7':
      return <Clock {...iconProps} />
    case 'expiring_30':
      return <Clock {...iconProps} />
    case 'valid':
      return <CheckCircle {...iconProps} />
    default:
      return <Shield {...iconProps} />
  }
}

/**
 * VaccinationStatusBadge - Shows vaccination status with colored badge
 * Uses neo-brutalist styling with small border and rounded corners
 */
export function VaccinationStatusBadge({
  status,
  size = 'md',
}: VaccinationStatusBadgeProps) {
  const colorClasses = getVaccinationStatusColor(status)
  const label = getVaccinationStatusLabel(status)

  const sizeClasses = {
    sm: {
      badge: 'px-1.5 py-0.5 text-xs gap-1',
      icon: 'h-3 w-3',
    },
    md: {
      badge: 'px-2 py-1 text-xs gap-1.5',
      icon: 'h-3.5 w-3.5',
    },
  }

  const currentSize = sizeClasses[size]

  return (
    <span
      className={cn(
        'inline-flex items-center font-semibold rounded-lg border shadow-[1px_1px_0px_0px_#1e293b]',
        colorClasses,
        currentSize.badge
      )}
    >
      {getStatusIcon(status, currentSize.icon)}
      {label}
    </span>
  )
}
