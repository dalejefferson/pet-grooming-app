import { format } from 'date-fns'
import { APPOINTMENT_STATUS_LABELS } from '@/config/constants'
import type { CustomEventProps } from './types'

/**
 * CustomEvent component renders individual appointment cards in the calendar.
 * It displays the client name, pet names, time, and status badge.
 */
export function CustomEvent({ event, onMouseEnter, onMouseLeave }: CustomEventProps) {
  const status = event.resource.status
  const statusLabel = APPOINTMENT_STATUS_LABELS[status]

  const handleMouseEnter = (e: React.MouseEvent) => {
    onMouseEnter?.(event, e)
  }

  return (
    <div
      className="h-full overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="font-bold text-xs leading-tight truncate">{event.clientName}</div>
      <div className="text-xs opacity-80 truncate">{event.petNames}</div>
      <div className="text-[10px] opacity-70 truncate">{format(event.start, 'h:mm a')}</div>
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
  )
}
