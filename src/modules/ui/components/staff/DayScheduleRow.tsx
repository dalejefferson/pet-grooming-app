import { useMemo, useEffect } from 'react'
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

function validateSchedule(schedule: DaySchedule): string[] {
  if (!schedule.isWorkingDay) return []

  const errors: string[] = []

  if (schedule.startTime && schedule.endTime && schedule.endTime <= schedule.startTime) {
    errors.push('End time must be after start time')
  }

  const hasBreakStart = !!schedule.breakStart
  const hasBreakEnd = !!schedule.breakEnd

  if (hasBreakStart && hasBreakEnd) {
    if (schedule.breakEnd! <= schedule.breakStart!) {
      errors.push('Break end must be after break start')
    }
    if (schedule.startTime && schedule.breakStart! < schedule.startTime) {
      errors.push('Break must start after work begins')
    }
    if (schedule.endTime && schedule.breakEnd! > schedule.endTime) {
      errors.push('Break must end before work ends')
    }
  } else if (hasBreakStart && !hasBreakEnd) {
    errors.push('Break end time is required')
  } else if (!hasBreakStart && hasBreakEnd) {
    errors.push('Break start time is required')
  }

  return errors
}

export interface DayScheduleRowProps {
  schedule: DaySchedule
  onChange: (schedule: DaySchedule) => void
  onValidationChange?: (dayOfWeek: DayOfWeek, hasErrors: boolean) => void
  disabled?: boolean
}

export function DayScheduleRow({
  schedule,
  onChange,
  onValidationChange,
  disabled = false,
}: DayScheduleRowProps) {
  const dayName = DAY_NAMES[schedule.dayOfWeek]

  const errors = useMemo(() => validateSchedule(schedule), [schedule])

  useEffect(() => {
    onValidationChange?.(schedule.dayOfWeek, errors.length > 0)
  }, [errors, schedule.dayOfWeek, onValidationChange])

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

  const hasErrors = errors.length > 0

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-3 rounded-xl border-2 bg-white p-3',
          'shadow-[2px_2px_0px_0px_#1e293b]',
          hasErrors ? 'border-red-400' : 'border-[#1e293b]',
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
                  'rounded-lg border-2 bg-white px-2 py-1 text-sm',
                  'focus:outline-none focus:shadow-[2px_2px_0px_0px_#1e293b] focus:-translate-y-0.5 transition-all',
                  'disabled:cursor-not-allowed disabled:bg-gray-50',
                  hasErrors ? 'border-red-400' : 'border-[#1e293b]'
                )}
              />
              <span className="text-sm text-[#64748b]">-</span>
              <input
                type="time"
                value={schedule.endTime}
                onChange={(e) => handleTimeChange('endTime', e.target.value)}
                disabled={disabled}
                className={cn(
                  'rounded-lg border-2 bg-white px-2 py-1 text-sm',
                  'focus:outline-none focus:shadow-[2px_2px_0px_0px_#1e293b] focus:-translate-y-0.5 transition-all',
                  'disabled:cursor-not-allowed disabled:bg-gray-50',
                  hasErrors ? 'border-red-400' : 'border-[#1e293b]'
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
                  'w-[90px] rounded-lg border-2 bg-white px-2 py-1 text-sm',
                  'focus:outline-none focus:shadow-[2px_2px_0px_0px_#1e293b] focus:-translate-y-0.5 transition-all',
                  'disabled:cursor-not-allowed disabled:bg-gray-50',
                  hasErrors ? 'border-red-400' : 'border-[#1e293b]'
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
                  'w-[90px] rounded-lg border-2 bg-white px-2 py-1 text-sm',
                  'focus:outline-none focus:shadow-[2px_2px_0px_0px_#1e293b] focus:-translate-y-0.5 transition-all',
                  'disabled:cursor-not-allowed disabled:bg-gray-50',
                  hasErrors ? 'border-red-400' : 'border-[#1e293b]'
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
      {hasErrors && (
        <div className="mt-1 ml-14 space-y-0.5">
          {errors.map((error) => (
            <p key={error} className="text-red-500 text-xs">{error}</p>
          ))}
        </div>
      )}
    </div>
  )
}
