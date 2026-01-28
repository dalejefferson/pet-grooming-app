import { cn } from '@/lib/utils'
import { Toggle } from '../common/Toggle'
import type { DaySchedule, DayOfWeek } from '@/types'

const DAY_NAMES: Record<DayOfWeek, string> = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
}

export interface DayScheduleRowProps {
  schedule: DaySchedule
  onChange: (schedule: DaySchedule) => void
  disabled?: boolean
}

export function DayScheduleRow({
  schedule,
  onChange,
  disabled = false,
}: DayScheduleRowProps) {
  const dayName = DAY_NAMES[schedule.dayOfWeek]

  const handleToggleWorkingDay = (isWorkingDay: boolean) => {
    onChange({
      ...schedule,
      isWorkingDay,
    })
  }

  const handleTimeChange = (
    field: 'startTime' | 'endTime' | 'breakStart' | 'breakEnd',
    value: string
  ) => {
    onChange({
      ...schedule,
      [field]: value,
    })
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-xl border-2 border-[#1e293b] bg-white p-3',
        'shadow-[2px_2px_0px_0px_#1e293b]',
        disabled && 'opacity-50'
      )}
    >
      {/* Day Name */}
      <div className="w-12 shrink-0">
        <span className="font-semibold text-[#1e293b]">{dayName}</span>
      </div>

      {/* Working Day Toggle */}
      <div className="shrink-0">
        <Toggle
          checked={schedule.isWorkingDay}
          onChange={handleToggleWorkingDay}
          disabled={disabled}
        />
      </div>

      {/* Time Inputs */}
      {schedule.isWorkingDay ? (
        <div className="flex flex-1 flex-wrap items-center gap-2 sm:gap-3">
          {/* Work Hours */}
          <div className="flex items-center gap-1">
            <input
              type="time"
              value={schedule.startTime}
              onChange={(e) => handleTimeChange('startTime', e.target.value)}
              disabled={disabled}
              className={cn(
                'rounded-lg border-2 border-[#1e293b] bg-white px-2 py-1 text-sm',
                'focus:outline-none focus:shadow-[2px_2px_0px_0px_#1e293b] focus:-translate-y-0.5 transition-all',
                'disabled:cursor-not-allowed disabled:bg-gray-50'
              )}
            />
            <span className="text-sm text-[#64748b]">-</span>
            <input
              type="time"
              value={schedule.endTime}
              onChange={(e) => handleTimeChange('endTime', e.target.value)}
              disabled={disabled}
              className={cn(
                'rounded-lg border-2 border-[#1e293b] bg-white px-2 py-1 text-sm',
                'focus:outline-none focus:shadow-[2px_2px_0px_0px_#1e293b] focus:-translate-y-0.5 transition-all',
                'disabled:cursor-not-allowed disabled:bg-gray-50'
              )}
            />
          </div>

          {/* Break Time (Optional) */}
          <div className="flex items-center gap-1 text-sm text-[#64748b]">
            <span className="hidden sm:inline">Break:</span>
            <input
              type="time"
              value={schedule.breakStart || ''}
              onChange={(e) => handleTimeChange('breakStart', e.target.value)}
              disabled={disabled}
              placeholder="--:--"
              className={cn(
                'w-[90px] rounded-lg border-2 border-[#1e293b] bg-white px-2 py-1 text-sm',
                'focus:outline-none focus:shadow-[2px_2px_0px_0px_#1e293b] focus:-translate-y-0.5 transition-all',
                'disabled:cursor-not-allowed disabled:bg-gray-50'
              )}
            />
            <span>-</span>
            <input
              type="time"
              value={schedule.breakEnd || ''}
              onChange={(e) => handleTimeChange('breakEnd', e.target.value)}
              disabled={disabled}
              placeholder="--:--"
              className={cn(
                'w-[90px] rounded-lg border-2 border-[#1e293b] bg-white px-2 py-1 text-sm',
                'focus:outline-none focus:shadow-[2px_2px_0px_0px_#1e293b] focus:-translate-y-0.5 transition-all',
                'disabled:cursor-not-allowed disabled:bg-gray-50'
              )}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1">
          <span className="text-sm italic text-[#64748b]">Day off</span>
        </div>
      )}
    </div>
  )
}
