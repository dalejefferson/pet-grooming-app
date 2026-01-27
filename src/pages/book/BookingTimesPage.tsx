import { useState, useMemo } from 'react'
import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom'
import { ArrowRight, ArrowLeft, ChevronLeft, ChevronRight, Clock, Check, User, Users } from 'lucide-react'
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

function GroomerCard({
  groomer,
  isSelected,
  onSelect,
}: {
  groomer: Groomer | null // null means "Any Available"
  isSelected: boolean
  onSelect: () => void
}) {
  const initials = groomer
    ? `${groomer.firstName[0]}${groomer.lastName[0]}`
    : null

  return (
    <button
      onClick={onSelect}
      className={cn(
        'relative flex flex-col items-center gap-2 rounded-xl border-3 p-4 text-center transition-all',
        isSelected
          ? 'border-primary-500 bg-primary-50 shadow-[4px_4px_0px_0px_rgba(var(--color-primary-500))]'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)]'
      )}
    >
      {isSelected && (
        <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-white">
          <Check className="h-4 w-4" />
        </div>
      )}

      {groomer ? (
        <>
          {groomer.imageUrl ? (
            <img
              src={groomer.imageUrl}
              alt={`${groomer.firstName} ${groomer.lastName}`}
              className="h-14 w-14 rounded-full border-2 border-gray-200 object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-primary-200 text-lg font-bold text-primary-700">
              {initials}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900">
              {groomer.firstName} {groomer.lastName}
            </p>
            {groomer.specialties.length > 0 && (
              <div className="mt-1 flex flex-wrap justify-center gap-1">
                {groomer.specialties.slice(0, 2).map((specialty) => (
                  <span
                    key={specialty}
                    className="rounded-full bg-accent-100 px-2 py-0.5 text-[10px] font-medium text-accent-700"
                  >
                    {specialty}
                  </span>
                ))}
                {groomer.specialties.length > 2 && (
                  <span className="text-[10px] text-gray-500">
                    +{groomer.specialties.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200">
            <Users className="h-7 w-7 text-gray-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Any Available</p>
            <p className="text-xs text-gray-500">First available groomer</p>
          </div>
        </>
      )}
    </button>
  )
}

export function BookingTimesPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { organization } = useOutletContext<{ organization: Organization }>()

  const petsParam = searchParams.get('pets')
  const selectedPets: SelectedPet[] = petsParam ? JSON.parse(petsParam) : []

  const { data: services = [] } = useActiveServices(organization.id)
  const { data: allGroomers = [] } = useGroomers()

  // Filter to only active groomers
  const groomers = useMemo(() => allGroomers.filter((g) => g.isActive), [allGroomers])

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
  const [selectedGroomerId, setSelectedGroomerId] = useState<string | undefined>(undefined) // undefined = "Any"

  // Fetch slots for selected groomer (or all if "Any")
  const { data: slotsForWeek = {} } = useAvailableSlotsForWeek(
    weekStart,
    totalDuration,
    organization.id,
    selectedGroomerId
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

  const handleSelectGroomer = (groomerId: string | undefined) => {
    setSelectedGroomerId(groomerId)
    setSelectedSlot(null) // Reset slot when groomer changes
  }

  const handleSelectSlot = (date: string, startTime: string, groomerId?: string) => {
    setSelectedSlot({ date, startTime, groomerId })
  }

  const handleContinue = () => {
    if (!selectedSlot) return

    const params = new URLSearchParams(searchParams)
    params.set('date', selectedSlot.date)
    params.set('time', selectedSlot.startTime)
    // Pass groomer ID: use selected groomer or the slot's groomer (for "Any")
    const groomerId = selectedGroomerId || selectedSlot.groomerId
    if (groomerId) {
      params.set('groomerId', groomerId)
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
        <h1 className="text-2xl font-bold text-gray-900">Choose Your Groomer & Time</h1>
        <p className="mt-2 text-gray-600">
          Select a groomer and an available time slot for your appointment.
        </p>
      </div>

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

      {/* Groomer Selection */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <User className="h-5 w-5 text-primary-500" />
          Select a Groomer
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {/* Any Available option */}
          <GroomerCard
            groomer={null}
            isSelected={selectedGroomerId === undefined}
            onSelect={() => handleSelectGroomer(undefined)}
          />
          {/* Individual groomers */}
          {groomers.map((groomer) => (
            <GroomerCard
              key={groomer.id}
              groomer={groomer}
              isSelected={selectedGroomerId === groomer.id}
              onSelect={() => handleSelectGroomer(groomer.id)}
            />
          ))}
        </div>
      </div>

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
                    const slotGroomer = !selectedGroomerId
                      ? getGroomerForSlot(dateStr, slot.startTime)
                      : groomers.find((g) => g.id === selectedGroomerId)

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
                        {!selectedGroomerId && slotGroomer && (
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
              {selectedGroomerId
                ? `with ${groomers.find((g) => g.id === selectedGroomerId)?.firstName} ${groomers.find((g) => g.id === selectedGroomerId)?.lastName}`
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
