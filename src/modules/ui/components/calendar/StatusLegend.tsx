import { Card } from '../common'
import { APPOINTMENT_STATUS_LABELS } from '@/config/constants'
import { STATUS_BG_COLORS, STATUS_BORDER_COLORS } from './types'
import type { AppointmentStatus } from '@/types'

/**
 * StatusLegend component displays a color-coded legend for appointment statuses.
 */
export function StatusLegend() {
  return (
    <Card className="bg-white/80 backdrop-blur-sm">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold text-[#334155]">Status:</span>
        {Object.entries(APPOINTMENT_STATUS_LABELS).map(([status, label]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div
              className="h-3 w-3 rounded-full border-2"
              style={{
                backgroundColor: STATUS_BG_COLORS[status as AppointmentStatus],
                borderColor: STATUS_BORDER_COLORS[status as AppointmentStatus],
              }}
            />
            <span className="text-xs text-[#64748b]">{label}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
