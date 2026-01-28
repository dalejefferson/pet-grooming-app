import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription } from '../common/Card'
import { Button } from '../common/Button'
import { Input } from '../common/Input'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { WeeklyScheduleEditor } from './WeeklyScheduleEditor'
import {
  useStaffAvailability,
  useUpdateStaffAvailability,
} from '@/modules/database/hooks'
import type { DaySchedule } from '@/types'

export interface StaffAvailabilityFormProps {
  staffId: string
}

const DEFAULT_SCHEDULE: DaySchedule[] = [
  { dayOfWeek: 0, isWorkingDay: false, startTime: '09:00', endTime: '17:00' },
  { dayOfWeek: 1, isWorkingDay: true, startTime: '09:00', endTime: '17:00' },
  { dayOfWeek: 2, isWorkingDay: true, startTime: '09:00', endTime: '17:00' },
  { dayOfWeek: 3, isWorkingDay: true, startTime: '09:00', endTime: '17:00' },
  { dayOfWeek: 4, isWorkingDay: true, startTime: '09:00', endTime: '17:00' },
  { dayOfWeek: 5, isWorkingDay: true, startTime: '09:00', endTime: '17:00' },
  { dayOfWeek: 6, isWorkingDay: false, startTime: '09:00', endTime: '17:00' },
]

export function StaffAvailabilityForm({ staffId }: StaffAvailabilityFormProps) {
  const { data: availability, isLoading } = useStaffAvailability(staffId)
  const updateMutation = useUpdateStaffAvailability()

  const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE)
  const [maxAppointmentsPerDay, setMaxAppointmentsPerDay] = useState(10)
  const [bufferMinutes, setBufferMinutes] = useState(15)
  const [hasChanges, setHasChanges] = useState(false)

  // Load data from availability
  useEffect(() => {
    if (availability) {
      setWeeklySchedule(availability.weeklySchedule || DEFAULT_SCHEDULE)
      setMaxAppointmentsPerDay(availability.maxAppointmentsPerDay)
      setBufferMinutes(availability.bufferMinutesBetweenAppointments)
      setHasChanges(false)
    }
  }, [availability])

  const handleScheduleChange = (newSchedule: DaySchedule[]) => {
    setWeeklySchedule(newSchedule)
    setHasChanges(true)
  }

  const handleMaxAppointmentsChange = (value: number) => {
    setMaxAppointmentsPerDay(Math.max(1, value))
    setHasChanges(true)
  }

  const handleBufferChange = (value: number) => {
    setBufferMinutes(Math.max(0, value))
    setHasChanges(true)
  }

  const handleSave = async () => {
    await updateMutation.mutateAsync({
      staffId,
      availability: {
        weeklySchedule,
        maxAppointmentsPerDay,
        bufferMinutesBetweenAppointments: bufferMinutes,
      },
    })
    setHasChanges(false)
  }

  if (isLoading) {
    return (
      <Card padding="lg">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Weekly Schedule */}
      <WeeklyScheduleEditor
        schedule={weeklySchedule}
        onChange={handleScheduleChange}
        disabled={updateMutation.isPending}
      />

      {/* Additional Settings */}
      <Card padding="lg">
        <CardHeader>
          <CardTitle>Booking Settings</CardTitle>
          <CardDescription>
            Configure appointment limits and buffer times
          </CardDescription>
        </CardHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            type="number"
            label="Max Appointments Per Day"
            value={maxAppointmentsPerDay}
            onChange={(e) =>
              handleMaxAppointmentsChange(parseInt(e.target.value) || 1)
            }
            min={1}
            max={50}
            helperText="Maximum number of appointments this staff member can have per day"
          />

          <Input
            type="number"
            label="Buffer Between Appointments"
            value={bufferMinutes}
            onChange={(e) =>
              handleBufferChange(parseInt(e.target.value) || 0)
            }
            min={0}
            max={120}
            helperText="Minutes of buffer time between appointments"
          />
        </div>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          loading={updateMutation.isPending}
          disabled={!hasChanges}
        >
          <Save className="mr-1.5 h-4 w-4" />
          Save Availability
        </Button>
      </div>

      {/* Success Message */}
      {updateMutation.isSuccess && !hasChanges && (
        <div className="rounded-xl border-2 border-[#1e293b] bg-[#d1fae5] p-3 text-center shadow-[2px_2px_0px_0px_#1e293b]">
          <p className="text-sm font-medium text-[#166534]">
            Availability saved successfully!
          </p>
        </div>
      )}

      {/* Error Message */}
      {updateMutation.isError && (
        <div className="rounded-xl border-2 border-[#1e293b] bg-[#fce7f3] p-3 text-center shadow-[2px_2px_0px_0px_#1e293b]">
          <p className="text-sm font-medium text-[#be123c]">
            Failed to save availability. Please try again.
          </p>
        </div>
      )}
    </div>
  )
}
