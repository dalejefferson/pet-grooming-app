import { format } from 'date-fns'
import { formatCurrency, formatDuration } from '@/lib/utils'
import { APPOINTMENT_STATUS_LABELS } from '@/config/constants'
import type { HoverPopupProps } from './types'
import { STATUS_BG_COLORS, STATUS_TEXT_COLORS, STATUS_BORDER_COLORS } from './types'
import type { Pet } from '@/types'

/**
 * HoverPopup component displays appointment details when hovering over calendar events.
 * It automatically positions itself to avoid viewport overflow.
 */
export function HoverPopup({ appointment, position, clients, pets, groomers }: HoverPopupProps) {
  const client = clients.find((c) => c.id === appointment.clientId)
  const appointmentPets = appointment.pets
    .map((p) => pets.find((pet) => pet.id === p.petId))
    .filter(Boolean) as Pet[]
  const groomer = appointment.groomerId
    ? groomers.find((g) => g.id === appointment.groomerId)
    : null
  const status = appointment.status
  const statusLabel = APPOINTMENT_STATUS_LABELS[status]

  // Get all services for display
  const popupServices = appointment.pets.flatMap((p) =>
    p.services.map((s) => ({
      petName: pets.find((pet) => pet.id === p.petId)?.name || 'Unknown',
      duration: s.finalDuration,
      price: s.finalPrice,
    }))
  )

  // Calculate position to avoid viewport overflow
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800
  const popupWidth = 300
  const popupHeight = 280 // Estimated height

  let left = position.x + 12
  let top = position.y + 12

  // If near right edge, show on left side of cursor
  if (position.x + popupWidth + 24 > viewportWidth) {
    left = position.x - popupWidth - 12
  }

  // If near bottom, show above cursor
  if (position.y + popupHeight + 24 > viewportHeight) {
    top = position.y - popupHeight - 12
  }

  // Ensure popup stays within viewport bounds
  left = Math.max(8, Math.min(left, viewportWidth - popupWidth - 8))
  top = Math.max(8, Math.min(top, viewportHeight - popupHeight - 8))

  return (
    <div
      className="fixed z-50 max-w-[300px] rounded-xl border-2 border-[#1e293b] bg-white p-4 shadow-[4px_4px_0px_0px_#1e293b] animate-in fade-in zoom-in-95 duration-150"
      style={{
        left: `${left}px`,
        top: `${top}px`,
      }}
    >
      {/* Client Name */}
      <div className="mb-2">
        <p className="font-bold text-[#1e293b]">
          {client ? `${client.firstName} ${client.lastName}` : 'Unknown Client'}
        </p>
      </div>

      {/* Pet Names */}
      <div className="mb-2">
        <p className="text-sm text-[#64748b]">
          <span className="font-medium text-[#334155]">Pets:</span>{' '}
          {appointmentPets.map((p) => p.name).join(', ') || 'None'}
        </p>
      </div>

      {/* Services */}
      <div className="mb-2">
        <p className="text-sm font-medium text-[#334155]">Services:</p>
        <div className="mt-1 space-y-0.5">
          {popupServices.slice(0, 3).map((s, idx) => (
            <p key={idx} className="text-xs text-[#64748b]">
              {s.petName}: {formatDuration(s.duration)} - {formatCurrency(s.price)}
            </p>
          ))}
          {popupServices.length > 3 && (
            <p className="text-xs text-[#94a3b8]">+{popupServices.length - 3} more...</p>
          )}
        </div>
      </div>

      {/* Time */}
      <div className="mb-2">
        <p className="text-sm text-[#64748b]">
          <span className="font-medium text-[#334155]">Time:</span>{' '}
          {format(new Date(appointment.startTime), 'h:mm a')} -{' '}
          {format(new Date(appointment.endTime), 'h:mm a')}
        </p>
      </div>

      {/* Groomer */}
      {groomer && (
        <div className="mb-2">
          <p className="text-sm text-[#64748b]">
            <span className="font-medium text-[#334155]">Groomer:</span>{' '}
            {groomer.firstName} {groomer.lastName}
          </p>
        </div>
      )}

      {/* Status Badge */}
      <div className="mb-2">
        <span
          className="inline-block rounded-lg px-2 py-1 text-xs font-semibold"
          style={{
            backgroundColor: STATUS_BG_COLORS[status],
            color: STATUS_TEXT_COLORS[status],
            border: `1px solid ${STATUS_BORDER_COLORS[status]}`,
          }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Total Amount */}
      <div className="border-t border-[#1e293b]/20 pt-2">
        <p className="text-sm font-bold text-[#1e293b]">
          Total: {formatCurrency(appointment.totalAmount)}
        </p>
      </div>
    </div>
  )
}
