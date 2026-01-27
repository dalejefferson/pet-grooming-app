import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom'
import { ArrowRight, ArrowLeft, ChevronLeft, ChevronRight, Clock, Users } from 'lucide-react'
import { Card, Button } from '@/components/common'
import { useAvailableSlotsForWeek, useActiveServices, useGroomers } from '@/hooks'
import { format, addWeeks, startOfWeek, addDays, parseISO, isBefore, startOfDay } from 'date-fns'
import type { Organization, Groomer } from '@/types'
import { cn } from '@/lib/utils'

interface SelectedPet {
  petId?: string
  isNewPet: boolean
  petInfo?: {
    name?: string
  }
  services: { serviceId: string; modifierIds: string[] }[]
}

export function BookingTimesPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { organization } = useOutletContext<{ organization: Organization }>()

  const petsParam = searchParams.get('pets')
  const groomerId = searchParams.get('groomerId') || undefined
  const selectedPets: SelectedPet[] = petsParam ? JSON.parse(petsParam) : []

  const { data: services = [] } = useActiveServices(organization.id)
  const { data: allGroomers = [] } = useGroomers()

  // Filter to only active groomers
  const groomers = useMemo(() => allGroomers.filter((g) => g.isActive), [allGroomers])

  // Find the selected groomer
  const selectedGroomer = useMemo(() => {
    if (!groomerId) return null
    return groomers.find((g) => g.id === groomerId) || null
  }, [groomerId, groomers])

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

    const params = new URLSearchParams(searchParams)
    params.set('date', selectedSlot.date)
    params.set('time', selectedSlot.startTime)
    // Pass groomer ID: use selected groomer or the slot's groomer (for "Any")
    const finalGroomerId = groomerId || selectedSlot.groomerId
    if (finalGroomerId) {
      params.set('groomerId', finalGroomerId)
    }
    navigate(`/book/${organization.slug}/confirm?${params.toString()}`)
  }

  const handleBack = () => {
    navigate(`/book/${organization.slug}/intake?${searchParams.toString()}`)
  }

  const today = startOfDay(new Date())

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
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/book/${organization.slug}/groomer?${searchParams.toString()}`)}
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

          return (
            <div key={dateStr} className="min-w-0">
              <div
                className={cn(
                  'mb-2 text-center',
                  isPast ? 'text-gray-400' : 'text-gray-900'
                )}
              >
                <div className="text-xs uppercase">{format(day, 'EEE')}</div>
                <div className="text-lg font-semibold">{format(day, 'd')}</div>
              </div>
              <div className="max-h-64 space-y-1 overflow-y-auto">
                {isPast ? (
                  <p className="py-4 text-center text-xs text-gray-400">-</p>
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
