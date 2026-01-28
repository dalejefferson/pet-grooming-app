import { format } from 'date-fns'
import { APPOINTMENT_STATUS_LABELS } from '@/config/constants'
import type { CustomEventProps } from './types'

/**
 * CustomEvent component renders individual appointment cards in the calendar.
 *
 * Month view: Compact single-line pill showing "9:00 AM • Client Name"
 * Day/Week views: Full details with client, pet, time, and status
 *
 * CSS classes control visibility:
 * - .event-full-details: hidden in month view, shown in day/week
 * - .event-compact: shown in month view, hidden in day/week
 */
export function CustomEvent({ event, onMouseEnter, onMouseLeave }: CustomEventProps) {
  const status = event.resource.status
  const statusLabel = APPOINTMENT_STATUS_LABELS[status]
  const timeStr = format(event.start, 'h:mm a')

  const handleMouseEnter = (e: React.MouseEvent) => {
    onMouseEnter?.(event, e)
  }

  return (
    <div
      className="h-full"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Compact view for month - single line pill */}
      <div className="event-compact hidden truncate text-[11px] font-medium leading-tight">
        <span className="opacity-80">{timeStr}</span>
        <span className="mx-1 opacity-50">•</span>
        <span>{event.clientName}</span>
      </div>

      {/* Full details for day/week views */}
      <div className="event-full-details">
        <div className="font-bold text-xs leading-tight truncate">{event.clientName}</div>
        <div className="text-xs opacity-80 truncate">{event.petNames}</div>
        <div className="text-[10px] opacity-70 truncate">{timeStr}</div>
        <div
          className="inline-block mt-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-semibold"
          style={{
            backgroundColor: status === 'completed' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.08)',
            color: 'inherit',
          }}
        >
          {statusLabel}
        </div>
      </div>
    </div>
  )
}
