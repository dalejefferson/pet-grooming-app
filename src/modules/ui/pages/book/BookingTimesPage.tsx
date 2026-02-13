import { useState, useMemo } from 'react'
import { useNavigate, Navigate, useParams } from 'react-router-dom'
import { ArrowRight, ArrowLeft, ChevronLeft, ChevronRight, Clock, Users, AlertCircle, Calendar } from 'lucide-react'
import { Card, Button } from '../../components/common'
import { useAvailableSlotsForWeek, useActiveServices, useGroomers, useStaffAvailability, useTimeOffRequests } from '@/hooks'
import { useBookingContext } from '../../context/BookingContext'
import { format, addWeeks, startOfWeek, addDays, parseISO, isBefore, startOfDay, isWithinInterval } from 'date-fns'
import type { Groomer, DayOfWeek } from '@/types'
import { cn } from '@/lib/utils'

export function BookingTimesPage() {
  const navigate = useNavigate()
  const { orgSlug } = useParams()
  const { organization, bookingState, updateBookingState } = useBookingContext()

  // Extract values with fallbacks for hooks (hooks must be called before any early return)
  const groomerId = bookingState.selectedGroomerId
  const selectedPets = useMemo(() => bookingState.selectedPets || [], [bookingState.selectedPets])

  const { data: services = [] } = useActiveServices(organization.id)
  const { data: allGroomers = [] } = useGroomers()

  // Filter to only active groomers
  const groomers = useMemo(() => allGroomers.filter((g) => g.isActive), [allGroomers])

  // Find the selected groomer
  const selectedGroomer = useMemo(() => {
    if (!groomerId) return null
    return groomers.find((g) => g.id === groomerId) || null
  }, [groomerId, groomers])

  // Get selected groomer's availability and time off
  const { data: groomerAvailability } = useStaffAvailability(groomerId || '')
  const { data: groomerTimeOff = [] } = useTimeOffRequests(groomerId)

  // Calculate total duration
  const totalDuration = useMemo(() => {
    let duration = 0
    for (const pet of selectedPets) {
      for (const selectedService of pet.services) {
        const service = services.find((s) => s.id === selectedService.serviceId)
        if (service) {
          duration += service.baseDurationMinutes
          for (const modifierId of selectedService.modifierIds) {
            const modifier = service.modifiers.find((m) => m.id === modifierId)
            if (modifier) {
              duration += modifier.durationMinutes
            }
          }
        }
      }
    }
    return duration
  }, [selectedPets, services])

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }))
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; startTime: string; groomerId?: string } | null>(null)

  // Fetch slots for selected groomer (or all if "Any")
  const { data: slotsForWeek = {} } = useAvailableSlotsForWeek(
    weekStart,
    totalDuration,
    organization.id,
    groomerId
  )

  // If "Any" is selected, fetch slots for each groomer to show names
  const { data: allGroomerSlots = {} } = useAvailableSlotsForWeek(
    weekStart,
    totalDuration,
    organization.id,
    undefined // Get all slots
  )

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }, [weekStart])

  // Guard: redirect if no pets with services selected (AFTER all hooks)
  const hasServicesSelected = bookingState.selectedPets?.some(
    (pet) => pet.services && pet.services.length > 0
  )
  if (!bookingState.selectedPets || bookingState.selectedPets.length === 0 || !hasServicesSelected) {
    return <Navigate to={`/book/${orgSlug}/start`} replace />
  }

  const handlePrevWeek = () => {
    setWeekStart((prev) => addWeeks(prev, -1))
    setSelectedSlot(null)
  }

  const handleNextWeek = () => {
    setWeekStart((prev) => addWeeks(prev, 1))
    setSelectedSlot(null)
  }

  const handleSelectSlot = (date: string, startTime: string, slotGroomerId?: string) => {
    setSelectedSlot({ date, startTime, groomerId: slotGroomerId })
  }

  const handleContinue = () => {
    if (!selectedSlot) return

    // Pass groomer ID: use selected groomer or the slot's groomer (for "Any")
    const finalGroomerId = groomerId || selectedSlot.groomerId
    updateBookingState({
      selectedTimeSlot: {
        date: selectedSlot.date,
        startTime: selectedSlot.startTime,
        endTime: '', // Will be calculated on confirm page
      },
      selectedGroomerId: finalGroomerId,
    })
    navigate(`/book/${organization.slug}/confirm`)
  }

  const handleBack = () => {
    navigate(`/book/${organization.slug}/intake`)
  }

  const today = startOfDay(new Date())

  // Helper function to check if groomer is working on a specific day
  const isGroomerWorkingOnDay = (day: Date): boolean => {
    if (!groomerId || !groomerAvailability) return true // Default to working if no groomer selected
    const dayOfWeek = day.getDay() as DayOfWeek
    const daySchedule = groomerAvailability.weeklySchedule.find((d) => d.dayOfWeek === dayOfWeek)
    return daySchedule?.isWorkingDay ?? false
  }

  // Helper function to check if groomer has time off on a specific day
  const hasTimeOffOnDay = (day: Date): boolean => {
    if (!groomerId || !groomerTimeOff) return false
    const approvedTimeOff = groomerTimeOff.filter((r) => r.status === 'approved')

    for (const timeOff of approvedTimeOff) {
      const timeOffStart = parseISO(timeOff.startDate)
      const timeOffEnd = parseISO(timeOff.endDate)
      timeOffStart.setHours(0, 0, 0, 0)
      timeOffEnd.setHours(23, 59, 59, 999)

      if (isWithinInterval(day, { start: timeOffStart, end: timeOffEnd })) {
        return true
      }
    }
    return false
  }

  // Helper function to get groomer's working hours for a specific day
  const getWorkingHoursForDay = (day: Date): { start: string; end: string } | null => {
    if (!groomerId || !groomerAvailability) return null
    const dayOfWeek = day.getDay() as DayOfWeek
    const daySchedule = groomerAvailability.weeklySchedule.find((d) => d.dayOfWeek === dayOfWeek)
    if (!daySchedule || !daySchedule.isWorkingDay) return null
    return { start: daySchedule.startTime, end: daySchedule.endTime }
  }

  // Get the groomer name for a slot when "Any" is selected
  const getGroomerForSlot = (dateStr: string, startTime: string): Groomer | undefined => {
    // Find the first available groomer for this slot
    for (const groomer of groomers) {
      const groomerSlots = allGroomerSlots[dateStr] || []
      const slot = groomerSlots.find(
        (s) => s.startTime === startTime && s.available && s.groomerId === groomer.id
      )
      if (slot) {
        return groomer
      }
    }
    return undefined
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Choose Your Time</h1>
        <p className="mt-2 text-gray-600">
          Select an available time slot for your appointment.
        </p>
      </div>

      {/* Selected Groomer Display */}
      <Card className="bg-accent-50 border-accent-200">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-accent-100">
            {selectedGroomer ? (
              selectedGroomer.imageUrl ? (
                <img
                  src={selectedGroomer.imageUrl}
                  alt={`${selectedGroomer.firstName} ${selectedGroomer.lastName}`}
                  className="h-12 w-12 object-cover"
                />
              ) : (
                <span className="text-lg font-bold text-accent-700">
                  {selectedGroomer.firstName[0]}
                  {selectedGroomer.lastName[0]}
                </span>
              )
            ) : (
              <Users className="h-6 w-6 text-accent-600" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm text-accent-600">Your Groomer</p>
            <p className="font-semibold text-accent-900">
              {selectedGroomer
                ? `${selectedGroomer.firstName} ${selectedGroomer.lastName}`
                : 'Any Available Groomer'}
            </p>
            {selectedGroomer && groomerAvailability && (
              <p className="text-xs text-accent-600 mt-1">
                <Calendar className="h-3 w-3 inline mr-1" />
                {groomerAvailability.weeklySchedule
                  .filter((d) => d.isWorkingDay)
                  .map((d) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.dayOfWeek])
                  .join(', ')}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/book/${organization.slug}/groomer`)}
          >
            Change
          </Button>
        </div>
      </Card>

      {/* Duration Summary */}
      <Card padding="sm" className="bg-primary-50 border-primary-200">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary-600" />
          <span className="font-medium text-primary-900">
            Estimated appointment duration: {Math.floor(totalDuration / 60)}h{' '}
            {totalDuration % 60 > 0 && `${totalDuration % 60}m`}
          </span>
        </div>
      </Card>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevWeek}
          disabled={isBefore(weekStart, today)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-medium text-gray-900">
          {format(weekStart, 'MMMM d')} - {format(addDays(weekStart, 6), 'MMMM d, yyyy')}
        </span>
        <Button variant="outline" size="sm" onClick={handleNextWeek}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const daySlots = slotsForWeek[dateStr] || []
          const availableSlots = daySlots.filter((s) => s.available)
          const isPast = isBefore(day, today)
          const isGroomerNotWorking = groomerId && !isGroomerWorkingOnDay(day)
          const groomerHasTimeOff = groomerId && hasTimeOffOnDay(day)
          const workingHours = getWorkingHoursForDay(day)

          return (
            <div key={dateStr} className="min-w-0">
              <div
                className={cn(
                  'mb-2 text-center',
                  isPast ? 'text-gray-400' : isGroomerNotWorking || groomerHasTimeOff ? 'text-gray-400' : 'text-gray-900'
                )}
              >
                <div className="text-xs uppercase">{format(day, 'EEE')}</div>
                <div className="text-lg font-semibold">{format(day, 'd')}</div>
                {workingHours && !groomerHasTimeOff && !isPast && (
                  <div className="text-[10px] text-gray-500">
                    {workingHours.start}-{workingHours.end}
                  </div>
                )}
              </div>
              <div className="max-h-64 space-y-1 overflow-y-auto">
                {isPast ? (
                  <p className="py-4 text-center text-xs text-gray-400">-</p>
                ) : groomerHasTimeOff ? (
                  <div className="py-3 text-center">
                    <AlertCircle className="h-4 w-4 mx-auto text-amber-500 mb-1" />
                    <p className="text-xs text-amber-600">Time Off</p>
                  </div>
                ) : isGroomerNotWorking ? (
                  <div className="py-3 text-center">
                    <p className="text-xs text-gray-400">Not Working</p>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <p className="py-4 text-center text-xs text-gray-500">No slots</p>
                ) : (
                  availableSlots.slice(0, 8).map((slot) => {
                    const isSelected =
                      selectedSlot?.date === slot.date &&
                      selectedSlot?.startTime === slot.startTime

                    // For "Any" selection, find which groomer would take this slot
                    const slotGroomer = !groomerId
                      ? getGroomerForSlot(dateStr, slot.startTime)
                      : selectedGroomer

                    return (
                      <button
                        key={`${slot.date}-${slot.startTime}`}
                        onClick={() => handleSelectSlot(slot.date, slot.startTime, slotGroomer?.id)}
                        className={cn(
                          'w-full rounded px-1 py-1.5 text-xs font-medium transition-colors',
                          isSelected
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        )}
                      >
                        <div>{slot.startTime}</div>
                        {!groomerId && slotGroomer && (
                          <div
                            className={cn(
                              'truncate text-[10px]',
                              isSelected ? 'text-primary-100' : 'text-gray-500'
                            )}
                          >
                            {slotGroomer.firstName}
                          </div>
                        )}
                      </button>
                    )
                  })
                )}
                {availableSlots.length > 8 && (
                  <p className="text-center text-xs text-gray-500">
                    +{availableSlots.length - 8} more
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected Time Display */}
      {selectedSlot && (
        <Card className="bg-success-50 border-success-200">
          <div className="text-center">
            <p className="font-medium text-success-900">Selected Appointment</p>
            <p className="text-lg text-success-700">
              {format(parseISO(selectedSlot.date), 'EEEE, MMMM d, yyyy')} at {selectedSlot.startTime}
            </p>
            <p className="mt-1 text-sm text-success-600">
              {groomerId && selectedGroomer
                ? `with ${selectedGroomer.firstName} ${selectedGroomer.lastName}`
                : selectedSlot.groomerId
                  ? `with ${groomers.find((g) => g.id === selectedSlot.groomerId)?.firstName} ${groomers.find((g) => g.id === selectedSlot.groomerId)?.lastName}`
                  : 'with First Available Groomer'}
            </p>
          </div>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleContinue} disabled={!selectedSlot}>
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
