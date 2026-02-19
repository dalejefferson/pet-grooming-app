import { useState, useCallback } from 'react'
import { Card, CardHeader, CardTitle } from '../common/Card'
import { DayScheduleRow } from './DayScheduleRow'
import type { DaySchedule, DayOfWeek } from '@/types'

export interface WeeklyScheduleEditorProps {
  schedule: DaySchedule[]
  onChange: (schedule: DaySchedule[]) => void
  onValidationChange?: (hasErrors: boolean) => void
  disabled?: boolean
}

// Ensure days are in order: Sunday (0) through Saturday (6)
const DAY_ORDER: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6]

export function WeeklyScheduleEditor({
  schedule,
  onChange,
  onValidationChange,
  disabled = false,
}: WeeklyScheduleEditorProps) {
  const [_dayErrors, setDayErrors] = useState<Record<number, boolean>>({})

  // Create a map for quick lookup
  const scheduleMap = new Map(schedule.map((s) => [s.dayOfWeek, s]))

  // Ensure all 7 days have a schedule entry
  const orderedSchedule = DAY_ORDER.map((dayOfWeek) => {
    return (
      scheduleMap.get(dayOfWeek) || {
        dayOfWeek,
        isWorkingDay: false,
        startTime: '09:00',
        endTime: '17:00',
      }
    )
  })

  const handleDayChange = (updatedDay: DaySchedule) => {
    const newSchedule = orderedSchedule.map((day) =>
      day.dayOfWeek === updatedDay.dayOfWeek ? updatedDay : day
    )
    onChange(newSchedule)
  }

  const handleDayValidationChange = useCallback((dayOfWeek: DayOfWeek, hasErrors: boolean) => {
    setDayErrors((prev) => {
      if (prev[dayOfWeek] === hasErrors) return prev
      const next = { ...prev, [dayOfWeek]: hasErrors }
      const anyErrors = Object.values(next).some(Boolean)
      onValidationChange?.(anyErrors)
      return next
    })
  }, [onValidationChange])

  return (
    <Card padding="lg">
      <CardHeader>
        <CardTitle>Weekly Schedule</CardTitle>
      </CardHeader>
      <div className="space-y-2">
        {orderedSchedule.map((daySchedule) => (
          <DayScheduleRow
            key={daySchedule.dayOfWeek}
            schedule={daySchedule}
            onChange={handleDayChange}
            onValidationChange={handleDayValidationChange}
            disabled={disabled}
          />
        ))}
      </div>
    </Card>
  )
}
