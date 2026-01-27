import { useState, useCallback, useMemo, useEffect } from 'react'
import { Calendar, dateFnsLocalizer, type View, type Components, type SlotInfo } from 'react-big-calendar'
import withDragAndDrop, { type EventInteractionArgs } from 'react-big-calendar/lib/addons/dragAndDrop'
import { format, parse, startOfWeek, getDay, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { Search, X, AlertTriangle, Plus, Clock, User, Scissors } from 'lucide-react'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'

import { Card, Drawer, Badge, Select, Modal, Button, Input, Textarea } from '@/components/common'
import { useAppointmentsByWeek, useClients, usePets, useGroomers, useUpdateAppointmentStatus, useUpdateAppointment, useClientPets, useServices, useCreateAppointment } from '@/hooks'
import { APPOINTMENT_STATUS_LABELS, CALENDAR_BUSINESS_HOURS } from '@/config/constants'
import { formatCurrency, formatDuration, cn } from '@/lib/utils'
import type { Appointment, AppointmentStatus, Pet, Groomer, Client } from '@/types'
import { useTheme } from '@/context/ThemeContext'

// Hover popup position type
interface HoverPosition {
  x: number
  y: number
}

// Props for the HoverPopup component
interface HoverPopupProps {
  appointment: Appointment
  position: HoverPosition
  clients: Client[]
  pets: Pet[]
  groomers: Groomer[]
}

// HoverPopup component for displaying appointment details on hover
function HoverPopup({ appointment, position, clients, pets, groomers }: HoverPopupProps) {
  const client = clients.find((c) => c.id === appointment.clientId)
  const appointmentPets = appointment.pets
    .map((p) => pets.find((pet) => pet.id === p.petId))
    .filter(Boolean) as Pet[]
  const groomer = appointment.groomerId
    ? groomers.find((g) => g.id === appointment.groomerId)
    : null
  const status = appointment.status
  const statusLabel = APPOINTMENT_STATUS_LABELS[status]

  // Get all services for display
  const popupServices = appointment.pets.flatMap((p) =>
    p.services.map((s) => ({
      petName: pets.find((pet) => pet.id === p.petId)?.name || 'Unknown',
      duration: s.finalDuration,
      price: s.finalPrice,
    }))
  )

  // Calculate position to avoid viewport overflow
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800
  const popupWidth = 300
  const popupHeight = 280 // Estimated height

  let left = position.x + 12
  let top = position.y + 12

  // If near right edge, show on left side of cursor
  if (position.x + popupWidth + 24 > viewportWidth) {
    left = position.x - popupWidth - 12
  }

  // If near bottom, show above cursor
  if (position.y + popupHeight + 24 > viewportHeight) {
    top = position.y - popupHeight - 12
  }

  // Ensure popup stays within viewport bounds
  left = Math.max(8, Math.min(left, viewportWidth - popupWidth - 8))
  top = Math.max(8, Math.min(top, viewportHeight - popupHeight - 8))

  return (
    <div
      className="fixed z-50 max-w-[300px] rounded-xl border-2 border-[#1e293b] bg-white p-4 shadow-[4px_4px_0px_0px_#1e293b] animate-in fade-in zoom-in-95 duration-150"
      style={{
        left: `${left}px`,
        top: `${top}px`,
      }}
    >
      {/* Client Name */}
      <div className="mb-2">
        <p className="font-bold text-[#1e293b]">
          {client ? `${client.firstName} ${client.lastName}` : 'Unknown Client'}
        </p>
      </div>

      {/* Pet Names */}
      <div className="mb-2">
        <p className="text-sm text-[#64748b]">
          <span className="font-medium text-[#334155]">Pets:</span>{' '}
          {appointmentPets.map((p) => p.name).join(', ') || 'None'}
        </p>
      </div>

      {/* Services */}
      <div className="mb-2">
        <p className="text-sm font-medium text-[#334155]">Services:</p>
        <div className="mt-1 space-y-0.5">
          {popupServices.slice(0, 3).map((s, idx) => (
            <p key={idx} className="text-xs text-[#64748b]">
              {s.petName}: {formatDuration(s.duration)} - {formatCurrency(s.price)}
            </p>
          ))}
          {popupServices.length > 3 && (
            <p className="text-xs text-[#94a3b8]">+{popupServices.length - 3} more...</p>
          )}
        </div>
      </div>

      {/* Time */}
      <div className="mb-2">
        <p className="text-sm text-[#64748b]">
          <span className="font-medium text-[#334155]">Time:</span>{' '}
          {format(new Date(appointment.startTime), 'h:mm a')} -{' '}
          {format(new Date(appointment.endTime), 'h:mm a')}
        </p>
      </div>

      {/* Groomer */}
      {groomer && (
        <div className="mb-2">
          <p className="text-sm text-[#64748b]">
            <span className="font-medium text-[#334155]">Groomer:</span>{' '}
            {groomer.firstName} {groomer.lastName}
          </p>
        </div>
      )}

      {/* Status Badge */}
      <div className="mb-2">
        <span
          className="inline-block rounded-lg px-2 py-1 text-xs font-semibold"
          style={{
            backgroundColor: STATUS_BG_COLORS[status],
            color: STATUS_TEXT_COLORS[status],
            border: `1px solid ${STATUS_BORDER_COLORS[status]}`,
          }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Total Amount */}
      <div className="border-t border-[#e2e8f0] pt-2">
        <p className="text-sm font-bold text-[#1e293b]">
          Total: {formatCurrency(appointment.totalAmount)}
        </p>
      </div>
    </div>
  )
}

const locales = { 'en-US': enUS }

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: Appointment
  clientName: string
  petNames: string
  serviceSummary: string
}

const statusOptions = Object.entries(APPOINTMENT_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}))

// Pastel status colors matching the theme
const STATUS_BG_COLORS: Record<AppointmentStatus, string> = {
  requested: '#fef9c3', // lemon
  confirmed: '#d1fae5', // mint
  checked_in: '#e9d5ff', // lavender
  in_progress: '#ecfccb', // lime
  completed: '#6F8F72', // primary green
  cancelled: '#e5e7eb', // gray
  no_show: '#fce7f3', // pink
}

const STATUS_TEXT_COLORS: Record<AppointmentStatus, string> = {
  requested: '#854d0e', // dark amber
  confirmed: '#065f46', // dark green
  checked_in: '#6b21a8', // dark purple
  in_progress: '#3f6212', // dark lime
  completed: '#ffffff', // white (for filled background)
  cancelled: '#374151', // dark gray
  no_show: '#9d174d', // dark pink
}

const STATUS_BORDER_COLORS: Record<AppointmentStatus, string> = {
  requested: '#fbbf24',
  confirmed: '#34d399',
  checked_in: '#a855f7',
  in_progress: '#84cc16',
  completed: '#49634c',
  cancelled: '#9ca3af',
  no_show: '#f472b6',
}

type ViewType = 'day' | 'week' | 'month'

// Create the drag-and-drop enabled calendar
const DragAndDropCalendar = withDragAndDrop<CalendarEvent, object>(Calendar)

// Interface for pending move state
interface PendingMove {
  event: CalendarEvent
  start: Date
  end: Date
  isResize: boolean
}

// Custom event component props interface
interface CustomEventProps {
  event: CalendarEvent
  onMouseEnter?: (event: CalendarEvent, e: React.MouseEvent) => void
  onMouseLeave?: () => void
}

// Custom event component for better appointment cards
function CustomEvent({ event, onMouseEnter, onMouseLeave }: CustomEventProps) {
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

// Interface for pet service selection
interface PetServiceSelection {
  petId: string
  serviceIds: string[]
}

export function CalendarPage() {
  const { colors } = useTheme()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<View>('week')
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false)
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null)
  const [showMoveConfirmModal, setShowMoveConfirmModal] = useState(false)

  // Hover popup state
  const [hoveredAppointment, setHoveredAppointment] = useState<Appointment | null>(null)
  const [hoverPosition, setHoverPosition] = useState<HoverPosition | null>(null)

  // Create appointment modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [selectedPetServices, setSelectedPetServices] = useState<PetServiceSelection[]>([])
  const [selectedGroomerId, setSelectedGroomerId] = useState<string>('')
  const [appointmentNotes, setAppointmentNotes] = useState('')
  const [createStartTime, setCreateStartTime] = useState<string>('')
  const [createEndTime, setCreateEndTime] = useState<string>('')

  const { data: appointments = [] } = useAppointmentsByWeek(currentDate)
  const { data: clients = [] } = useClients()
  const { data: pets = [] } = usePets()
  const { data: groomers = [] } = useGroomers()
  const { data: services = [] } = useServices()
  const { data: clientPets = [] } = useClientPets(selectedClientId)
  const updateStatus = useUpdateAppointmentStatus()
  const updateAppointment = useUpdateAppointment()
  const createAppointment = useCreateAppointment()

  const events: CalendarEvent[] = useMemo(() => {
    return appointments.map((apt) => {
      const client = clients.find((c) => c.id === apt.clientId)
      const petNames = apt.pets
        .map((p) => pets.find((pet) => pet.id === p.petId)?.name)
        .filter(Boolean)
        .join(', ')

      const serviceSummary = apt.pets
        .flatMap((p) => p.services.map(() => 'Grooming'))
        .slice(0, 2)
        .join(', ') + (apt.pets.flatMap((p) => p.services).length > 2 ? '...' : '')

      return {
        id: apt.id,
        title: client
          ? `${client.firstName} ${client.lastName} - ${petNames || 'Pet'}`
          : `Appointment - ${petNames || 'Pet'}`,
        start: new Date(apt.startTime),
        end: new Date(apt.endTime),
        resource: apt,
        clientName: client ? `${client.firstName} ${client.lastName}` : 'Unknown Client',
        petNames: petNames || 'Pet',
        serviceSummary,
      }
    })
  }, [appointments, clients, pets])

  // Filter events based on search query
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) {
      return events
    }
    const query = searchQuery.toLowerCase().trim()
    return events.filter((event) => {
      const clientMatch = event.clientName.toLowerCase().includes(query)
      const petMatch = event.petNames.toLowerCase().includes(query)
      return clientMatch || petMatch
    })
  }, [events, searchQuery])

  // Handle ESC key to clear search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchQuery])

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedAppointment(event.resource)
  }, [])

  const handleNavigate = useCallback((date: Date) => {
    setCurrentDate(date)
  }, [])

  const handleViewChange = useCallback((newView: View) => {
    setView(newView)
  }, [])

  const handleStatusChange = async (status: AppointmentStatus) => {
    if (selectedAppointment) {
      await updateStatus.mutateAsync({ id: selectedAppointment.id, status })
      setSelectedAppointment((prev) => (prev ? { ...prev, status } : null))
    }
  }

  // Navigation handlers
  const goToPrev = useCallback(() => {
    if (view === 'month') {
      setCurrentDate((d) => subMonths(d, 1))
    } else if (view === 'week') {
      setCurrentDate((d) => subWeeks(d, 1))
    } else {
      setCurrentDate((d) => subDays(d, 1))
    }
  }, [view])

  const goToNext = useCallback(() => {
    if (view === 'month') {
      setCurrentDate((d) => addMonths(d, 1))
    } else if (view === 'week') {
      setCurrentDate((d) => addWeeks(d, 1))
    } else {
      setCurrentDate((d) => addDays(d, 1))
    }
  }, [view])

  const goToToday = useCallback(() => {
    setCurrentDate(new Date())
  }, [])

  // Hover handlers for appointment popup
  const handleEventMouseEnter = useCallback((event: CalendarEvent, e: React.MouseEvent) => {
    // Don't show hover popup if dragging
    if (isDragging) return
    setHoveredAppointment(event.resource)
    setHoverPosition({ x: e.clientX, y: e.clientY })
  }, [isDragging])

  const handleEventMouseLeave = useCallback(() => {
    setHoveredAppointment(null)
    setHoverPosition(null)
  }, [])

  // Drag and drop handlers
  const handleDragStart = useCallback(() => {
    setIsDragging(true)
    // Close any hover popup that might be open
    setSelectedAppointment(null)
    setHoveredAppointment(null)
    setHoverPosition(null)
  }, [])

  const handleEventDrop = useCallback(
    ({ event, start, end }: EventInteractionArgs<CalendarEvent>) => {
      setIsDragging(false)

      // Check if dropped in the same location
      const isSameTime =
        event.start.getTime() === new Date(start).getTime() &&
        event.end.getTime() === new Date(end).getTime()

      if (isSameTime) {
        // Snap back, no action needed
        return
      }

      // Store the pending move and show confirmation modal
      setPendingMove({
        event,
        start: new Date(start),
        end: new Date(end),
        isResize: false,
      })
      setShowMoveConfirmModal(true)
    },
    []
  )

  const handleEventResize = useCallback(
    ({ event, start, end }: EventInteractionArgs<CalendarEvent>) => {
      setIsDragging(false)

      // Check if same duration
      const isSameDuration =
        event.start.getTime() === new Date(start).getTime() &&
        event.end.getTime() === new Date(end).getTime()

      if (isSameDuration) {
        return
      }

      // Store the pending resize and show confirmation modal
      setPendingMove({
        event,
        start: new Date(start),
        end: new Date(end),
        isResize: true,
      })
      setShowMoveConfirmModal(true)
    },
    []
  )

  const handleConfirmMove = useCallback(async () => {
    if (!pendingMove) return

    try {
      await updateAppointment.mutateAsync({
        id: pendingMove.event.resource.id,
        data: {
          startTime: pendingMove.start.toISOString(),
          endTime: pendingMove.end.toISOString(),
        },
      })
    } catch (error) {
      console.error('Failed to update appointment:', error)
    }

    setPendingMove(null)
    setShowMoveConfirmModal(false)
  }, [pendingMove, updateAppointment])

  const handleCancelMove = useCallback(() => {
    setPendingMove(null)
    setShowMoveConfirmModal(false)
  }, [])

  // Handle slot selection for creating new appointment
  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    // Pre-fill the time inputs from the selected slot
    setCreateStartTime(format(slotInfo.start, "yyyy-MM-dd'T'HH:mm"))
    setCreateEndTime(format(slotInfo.end, "yyyy-MM-dd'T'HH:mm"))
    // Reset form state
    setSelectedClientId('')
    setSelectedPetServices([])
    setSelectedGroomerId('')
    setAppointmentNotes('')
    // Open the modal
    setShowCreateModal(true)
  }, [])

  // Handle client selection change - reset pet services when client changes
  const handleClientChange = useCallback((clientId: string) => {
    setSelectedClientId(clientId)
    setSelectedPetServices([])
  }, [])

  // Toggle pet selection
  const handlePetToggle = useCallback((petId: string) => {
    setSelectedPetServices((prev) => {
      const existing = prev.find((p) => p.petId === petId)
      if (existing) {
        return prev.filter((p) => p.petId !== petId)
      }
      return [...prev, { petId, serviceIds: [] }]
    })
  }, [])

  // Toggle service for a pet
  const handleServiceToggle = useCallback((petId: string, serviceId: string) => {
    setSelectedPetServices((prev) => {
      return prev.map((p) => {
        if (p.petId !== petId) return p
        const hasService = p.serviceIds.includes(serviceId)
        return {
          ...p,
          serviceIds: hasService
            ? p.serviceIds.filter((s) => s !== serviceId)
            : [...p.serviceIds, serviceId],
        }
      })
    })
  }, [])

  // Calculate total based on selected services
  const calculatedTotal = useMemo(() => {
    let total = 0
    selectedPetServices.forEach((ps) => {
      ps.serviceIds.forEach((serviceId) => {
        const service = services.find((s) => s.id === serviceId)
        if (service) {
          total += service.basePrice
        }
      })
    })
    return total
  }, [selectedPetServices, services])

  // Calculate total duration
  const calculatedDuration = useMemo(() => {
    let duration = 0
    selectedPetServices.forEach((ps) => {
      ps.serviceIds.forEach((serviceId) => {
        const service = services.find((s) => s.id === serviceId)
        if (service) {
          duration += service.baseDurationMinutes
        }
      })
    })
    return duration
  }, [selectedPetServices, services])

  // Handle create appointment submission
  const handleCreateAppointment = useCallback(async () => {
    if (!selectedClientId || selectedPetServices.length === 0) return

    // Validate at least one pet has services
    const hasServices = selectedPetServices.some((ps) => ps.serviceIds.length > 0)
    if (!hasServices) return

    const startTime = new Date(createStartTime)
    const endTime = new Date(createEndTime)

    try {
      await createAppointment.mutateAsync({
        organizationId: 'org-1', // TODO: Get from context
        clientId: selectedClientId,
        pets: selectedPetServices
          .filter((ps) => ps.serviceIds.length > 0)
          .map((ps) => ({
            petId: ps.petId,
            services: ps.serviceIds.map((serviceId) => {
              const service = services.find((s) => s.id === serviceId)
              return {
                serviceId,
                appliedModifiers: [],
                finalDuration: service?.baseDurationMinutes || 60,
                finalPrice: service?.basePrice || 0,
              }
            }),
          })),
        groomerId: selectedGroomerId || undefined,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        status: 'confirmed' as AppointmentStatus,
        internalNotes: appointmentNotes || undefined,
        depositPaid: false,
        totalAmount: calculatedTotal,
      })

      // Close modal and reset
      setShowCreateModal(false)
      setSelectedClientId('')
      setSelectedPetServices([])
      setSelectedGroomerId('')
      setAppointmentNotes('')
    } catch (error) {
      console.error('Failed to create appointment:', error)
    }
  }, [
    selectedClientId,
    selectedPetServices,
    selectedGroomerId,
    appointmentNotes,
    createStartTime,
    createEndTime,
    calculatedTotal,
    services,
    createAppointment,
  ])

  // Close create modal
  const handleCloseCreateModal = useCallback(() => {
    setShowCreateModal(false)
    setSelectedClientId('')
    setSelectedPetServices([])
    setSelectedGroomerId('')
    setAppointmentNotes('')
  }, [])

  // Get display date based on view
  const getDisplayDate = useCallback(() => {
    if (view === 'month') {
      return format(currentDate, 'MMMM yyyy')
    } else if (view === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
      const weekEnd = addDays(weekStart, 6)
      if (format(weekStart, 'MMMM') === format(weekEnd, 'MMMM')) {
        return `${format(weekStart, 'MMMM d')} - ${format(weekEnd, 'd, yyyy')}`
      }
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
    } else {
      return format(currentDate, 'EEEE, MMMM d, yyyy')
    }
  }, [currentDate, view])

  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const status = event.resource.status
    return {
      style: {
        backgroundColor: STATUS_BG_COLORS[status],
        color: STATUS_TEXT_COLORS[status],
        border: `2px solid ${STATUS_BORDER_COLORS[status]}`,
        borderRadius: '12px',
        padding: '4px 8px',
        fontSize: '13px',
        fontWeight: '500',
        boxShadow: '2px 2px 0px 0px #1e293b',
      },
    }
  }, [])

  const selectedClient = selectedAppointment
    ? clients.find((c) => c.id === selectedAppointment.clientId)
    : null

  const selectedPets = selectedAppointment
    ? selectedAppointment.pets.map((p) => pets.find((pet) => pet.id === p.petId)).filter(Boolean)
    : []

  const selectedGroomer = selectedAppointment?.groomerId
    ? groomers.find((g) => g.id === selectedAppointment.groomerId)
    : null

  // Custom event wrapper that includes hover handlers
  const EventWrapper = useCallback(
    ({ event }: { event: CalendarEvent }) => (
      <CustomEvent
        event={event}
        onMouseEnter={handleEventMouseEnter}
        onMouseLeave={handleEventMouseLeave}
      />
    ),
    [handleEventMouseEnter, handleEventMouseLeave]
  )

  // Custom components for the calendar
  const components: Components<CalendarEvent, object> = useMemo(
    () => ({
      event: EventWrapper,
      toolbar: () => null, // We use our own custom toolbar
    }),
    [EventWrapper]
  )

  const viewButtons: { value: ViewType; label: string }[] = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
  ]

  return (
    <div className={cn('min-h-full', colors.pageGradientLight)}>
      <div className="space-y-6">
        {/* Custom Header with Navigation and View Toggle */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Left: Title and Date Navigation */}
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-[#1e293b]">Calendar</h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={goToPrev}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#1e293b] bg-white shadow-[2px_2px_0px_0px_#1e293b] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#1e293b] active:translate-y-0 active:shadow-[1px_1px_0px_0px_#1e293b]"
                  aria-label="Previous"
                >
                  <svg className="h-5 w-5 text-[#334155]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={goToToday}
                  className="rounded-xl border-2 border-[#1e293b] bg-[#fef9c3] px-3 py-1.5 text-sm font-semibold text-[#334155] shadow-[2px_2px_0px_0px_#1e293b] transition-all hover:-translate-y-0.5 hover:bg-[#fde68a] hover:shadow-[3px_3px_0px_0px_#1e293b] active:translate-y-0 active:shadow-[1px_1px_0px_0px_#1e293b]"
                >
                  Today
                </button>
                <button
                  onClick={goToNext}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#1e293b] bg-white shadow-[2px_2px_0px_0px_#1e293b] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#1e293b] active:translate-y-0 active:shadow-[1px_1px_0px_0px_#1e293b]"
                  aria-label="Next"
                >
                  <svg className="h-5 w-5 text-[#334155]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Center: Current Date Display */}
            <div className="text-center">
              <h2 className="text-xl font-bold text-[#1e293b]">{getDisplayDate()}</h2>
            </div>

            {/* Search Input */}
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search clients or pets..."
                  className="w-64 rounded-xl border-2 border-[#1e293b] bg-white py-2 pl-10 pr-10 text-sm text-[#1e293b] placeholder-[#94a3b8] shadow-[2px_2px_0px_0px_#1e293b] transition-all focus:outline-none focus:shadow-[3px_3px_0px_0px_#1e293b] focus:-translate-y-0.5"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b] transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {searchQuery && (
                <div className="absolute left-0 top-full mt-1 text-xs text-[#64748b]">
                  Showing {filteredEvents.length} of {events.length} appointments
                </div>
              )}
            </div>

            {/* Right: View Toggle Buttons */}
            <div className="flex items-center gap-1 rounded-xl border-2 border-[#1e293b] bg-white p-1 shadow-[2px_2px_0px_0px_#1e293b]">
              {viewButtons.map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => handleViewChange(btn.value)}
                  className={cn(
                    'rounded-lg px-4 py-1.5 text-sm font-semibold transition-all',
                    view === btn.value
                      ? 'bg-primary-500 text-white shadow-inner'
                      : 'bg-transparent text-[#334155] hover:bg-[#f0fdf4]'
                  )}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Status Legend */}
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

        {/* Calendar */}
        <Card padding="none" className={cn(
          "overflow-hidden bg-white/80 backdrop-blur-sm",
          isDragging && "cursor-grabbing"
        )}>
          <div className="p-4" style={{ height: 'calc(100vh - 340px)', minHeight: '500px' }}>
            <DragAndDropCalendar
              localizer={localizer}
              events={filteredEvents}
              startAccessor="start"
              endAccessor="end"
              view={view}
              date={currentDate}
              onNavigate={handleNavigate}
              onView={handleViewChange}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              components={components}
              min={new Date(0, 0, 0, CALENDAR_BUSINESS_HOURS.start)}
              max={new Date(0, 0, 0, CALENDAR_BUSINESS_HOURS.end)}
              views={['day', 'week', 'month']}
              step={15}
              timeslots={4}
              popup
              selectable
              draggableAccessor={() => true}
              resizable
              onDragStart={handleDragStart}
              onEventDrop={handleEventDrop}
              onEventResize={handleEventResize}
              onSelectSlot={handleSelectSlot}
            />
          </div>
        </Card>

        {/* Hover Popup */}
        {hoveredAppointment && hoverPosition && (
          <HoverPopup
            appointment={hoveredAppointment}
            position={hoverPosition}
            clients={clients}
            pets={pets}
            groomers={groomers}
          />
        )}

        {/* Appointment Details Drawer */}
        <Drawer
          isOpen={!!selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          title="Appointment Details"
          size="md"
        >
          {selectedAppointment && (
            <div className="space-y-6">
              {/* Status with color indicator */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Status
                </label>
                <div className="flex items-center gap-3">
                  <div
                    className="h-4 w-4 rounded-full border-2"
                    style={{
                      backgroundColor: STATUS_BG_COLORS[selectedAppointment.status],
                      borderColor: STATUS_BORDER_COLORS[selectedAppointment.status],
                    }}
                  />
                  <Select
                    options={statusOptions}
                    value={selectedAppointment.status}
                    onChange={(e) => handleStatusChange(e.target.value as AppointmentStatus)}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Time */}
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-700">Time</h3>
                <p className="text-gray-900">
                  {format(new Date(selectedAppointment.startTime), 'EEEE, MMMM d, yyyy')}
                </p>
                <p className="text-gray-600">
                  {format(new Date(selectedAppointment.startTime), 'h:mm a')} -{' '}
                  {format(new Date(selectedAppointment.endTime), 'h:mm a')}
                </p>
              </div>

              {/* Client */}
              {selectedClient && (
                <div>
                  <h3 className="mb-2 text-sm font-medium text-gray-700">Client</h3>
                  <p className="text-gray-900">
                    {selectedClient.firstName} {selectedClient.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{selectedClient.email}</p>
                  <p className="text-sm text-gray-600">{selectedClient.phone}</p>
                </div>
              )}

              {/* Groomer */}
              {selectedGroomer && (
                <div>
                  <h3 className="mb-2 text-sm font-medium text-gray-700">Groomer</h3>
                  <p className="text-gray-900">{selectedGroomer.firstName} {selectedGroomer.lastName}</p>
                </div>
              )}

              {/* Pets & Services */}
              <div>
                <h3 className="mb-2 text-sm font-medium text-gray-700">Pets & Services</h3>
                <div className="space-y-3">
                  {selectedAppointment.pets.map((aptPet, index) => {
                    const pet = selectedPets[index]
                    return (
                      <div key={aptPet.petId} className="rounded-xl border-2 border-[#1e293b] bg-[#fef9c3]/30 p-3 shadow-[2px_2px_0px_0px_#1e293b]">
                        <p className="font-semibold text-gray-900">
                          {pet?.name || 'Unknown Pet'}
                        </p>
                        {pet && (
                          <p className="text-sm text-gray-600">
                            {pet.breed} - {pet.species}
                          </p>
                        )}
                        <div className="mt-2 space-y-1">
                          {aptPet.services.map((service, sIdx) => (
                            <div key={sIdx} className="flex justify-between text-sm">
                              <span className="text-gray-600">
                                Service ({formatDuration(service.finalDuration)})
                              </span>
                              <span className="font-medium text-gray-900">
                                {formatCurrency(service.finalPrice)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Notes */}
              {(selectedAppointment.internalNotes || selectedAppointment.clientNotes) && (
                <div>
                  <h3 className="mb-2 text-sm font-medium text-gray-700">Notes</h3>
                  {selectedAppointment.internalNotes && (
                    <div className="mb-2">
                      <Badge variant="secondary" size="sm">Internal</Badge>
                      <p className="mt-1 text-sm text-gray-600">
                        {selectedAppointment.internalNotes}
                      </p>
                    </div>
                  )}
                  {selectedAppointment.clientNotes && (
                    <div>
                      <Badge variant="outline" size="sm">Client</Badge>
                      <p className="mt-1 text-sm text-gray-600">
                        {selectedAppointment.clientNotes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Totals */}
              <div className="border-t-2 border-[#1e293b] pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Deposit</span>
                  <span className={cn(
                    selectedAppointment.depositPaid ? 'text-success-600 font-medium' : 'text-gray-900'
                  )}>
                    {selectedAppointment.depositAmount
                      ? `${formatCurrency(selectedAppointment.depositAmount)} ${selectedAppointment.depositPaid ? '(Paid)' : '(Pending)'}`
                      : 'None'}
                  </span>
                </div>
                <div className="mt-2 flex justify-between">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-primary-600">
                    {formatCurrency(selectedAppointment.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </Drawer>

        {/* Create Appointment Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={handleCloseCreateModal}
          title="Create New Appointment"
          size="xl"
        >
          <div className="space-y-6">
            {/* No Clients Warning */}
            {clients.length === 0 ? (
              <div className="rounded-xl border-2 border-[#fbbf24] bg-[#fef9c3] p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-[#854d0e]" />
                  <div>
                    <p className="font-semibold text-[#854d0e]">No Clients Found</p>
                    <p className="text-sm text-[#854d0e]/80">
                      Please add clients first before creating appointments.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Time Section */}
                <div className="rounded-xl border-2 border-[#1e293b] bg-[#ecfccb]/30 p-4 shadow-[2px_2px_0px_0px_#1e293b]">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-5 w-5 text-[#334155]" />
                    <h3 className="font-semibold text-[#1e293b]">Appointment Time</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="datetime-local"
                      label="Start Time"
                      value={createStartTime}
                      onChange={(e) => setCreateStartTime(e.target.value)}
                    />
                    <Input
                      type="datetime-local"
                      label="End Time"
                      value={createEndTime}
                      onChange={(e) => setCreateEndTime(e.target.value)}
                    />
                  </div>
                  {calculatedDuration > 0 && (
                    <p className="mt-2 text-sm text-[#64748b]">
                      Estimated duration based on services: {formatDuration(calculatedDuration)}
                    </p>
                  )}
                </div>

                {/* Client Selection */}
                <div className="rounded-xl border-2 border-[#1e293b] bg-[#d1fae5]/30 p-4 shadow-[2px_2px_0px_0px_#1e293b]">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-5 w-5 text-[#334155]" />
                    <h3 className="font-semibold text-[#1e293b]">Client</h3>
                  </div>
                  <Select
                    label="Select Client"
                    placeholder="Choose a client..."
                    value={selectedClientId}
                    onChange={(e) => handleClientChange(e.target.value)}
                    options={clients.map((c) => ({
                      value: c.id,
                      label: `${c.firstName} ${c.lastName}`,
                    }))}
                  />
                </div>

                {/* Pet Selection */}
                {selectedClientId && (
                  <div className="rounded-xl border-2 border-[#1e293b] bg-[#fce7f3]/30 p-4 shadow-[2px_2px_0px_0px_#1e293b]">
                    <h3 className="font-semibold text-[#1e293b] mb-3">Pets</h3>
                    {clientPets.length === 0 ? (
                      <p className="text-sm text-[#64748b]">No pets found for this client.</p>
                    ) : (
                      <div className="space-y-3">
                        {clientPets.map((pet) => {
                          const isSelected = selectedPetServices.some((ps) => ps.petId === pet.id)
                          const petServiceSelection = selectedPetServices.find((ps) => ps.petId === pet.id)
                          return (
                            <div
                              key={pet.id}
                              className={cn(
                                'rounded-xl border-2 p-3 transition-all cursor-pointer',
                                isSelected
                                  ? 'border-primary-500 bg-primary-50 shadow-[2px_2px_0px_0px_#49634c]'
                                  : 'border-[#1e293b] bg-white hover:bg-[#f0fdf4]'
                              )}
                              onClick={() => handlePetToggle(pet.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold text-[#1e293b]">{pet.name}</p>
                                  <p className="text-sm text-[#64748b]">
                                    {pet.breed} - {pet.species}
                                  </p>
                                </div>
                                <div
                                  className={cn(
                                    'h-5 w-5 rounded-md border-2 flex items-center justify-center',
                                    isSelected
                                      ? 'bg-primary-500 border-primary-500'
                                      : 'border-[#1e293b] bg-white'
                                  )}
                                >
                                  {isSelected && (
                                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                              </div>

                              {/* Services for this pet */}
                              {isSelected && (
                                <div className="mt-3 pt-3 border-t border-[#1e293b]/20" onClick={(e) => e.stopPropagation()}>
                                  <p className="text-sm font-medium text-[#334155] mb-2">Select Services:</p>
                                  <div className="grid grid-cols-2 gap-2">
                                    {services.filter((s) => s.isActive).map((service) => {
                                      const isServiceSelected = petServiceSelection?.serviceIds.includes(service.id)
                                      return (
                                        <button
                                          key={service.id}
                                          type="button"
                                          onClick={() => handleServiceToggle(pet.id, service.id)}
                                          className={cn(
                                            'flex items-center justify-between p-2 rounded-lg border-2 text-left text-sm transition-all',
                                            isServiceSelected
                                              ? 'border-accent-500 bg-accent-50 text-accent-700'
                                              : 'border-[#1e293b] bg-white hover:bg-[#fef9c3]'
                                          )}
                                        >
                                          <span className="font-medium truncate">{service.name}</span>
                                          <span className="text-xs">{formatCurrency(service.basePrice)}</span>
                                        </button>
                                      )
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Groomer Selection */}
                <div className="rounded-xl border-2 border-[#1e293b] bg-[#e9d5ff]/30 p-4 shadow-[2px_2px_0px_0px_#1e293b]">
                  <div className="flex items-center gap-2 mb-3">
                    <Scissors className="h-5 w-5 text-[#334155]" />
                    <h3 className="font-semibold text-[#1e293b]">Groomer (Optional)</h3>
                  </div>
                  <Select
                    label="Select Groomer"
                    placeholder="Choose a groomer..."
                    value={selectedGroomerId}
                    onChange={(e) => setSelectedGroomerId(e.target.value)}
                    options={[
                      { value: '', label: 'Any available groomer' },
                      ...groomers.filter((g) => g.isActive).map((g) => ({
                        value: g.id,
                        label: `${g.firstName} ${g.lastName}`,
                      })),
                    ]}
                  />
                </div>

                {/* Notes */}
                <div>
                  <Textarea
                    label="Notes (Optional)"
                    placeholder="Add any notes for this appointment..."
                    value={appointmentNotes}
                    onChange={(e) => setAppointmentNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Total & Submit */}
                <div className="rounded-xl border-2 border-[#1e293b] bg-white p-4 shadow-[2px_2px_0px_0px_#1e293b]">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-bold text-[#1e293b]">Estimated Total</span>
                    <span className="text-2xl font-bold text-primary-600">
                      {formatCurrency(calculatedTotal)}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleCloseCreateModal}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="accent"
                      onClick={handleCreateAppointment}
                      disabled={
                        !selectedClientId ||
                        selectedPetServices.length === 0 ||
                        !selectedPetServices.some((ps) => ps.serviceIds.length > 0) ||
                        createAppointment.isPending
                      }
                      loading={createAppointment.isPending}
                      className="flex-1"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Appointment
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        </Modal>

        {/* Reschedule Confirmation Modal */}
        <Modal
          isOpen={showMoveConfirmModal}
          onClose={handleCancelMove}
          title={pendingMove?.isResize ? 'Change Appointment Duration?' : 'Reschedule Appointment?'}
          size="md"
        >
          {pendingMove && (
            <div className="space-y-4">
              {/* Client Info */}
              <div className="rounded-xl border-2 border-[#1e293b] bg-[#f0fdf4] p-4">
                <p className="font-semibold text-[#1e293b]">{pendingMove.event.clientName}</p>
                <p className="text-sm text-[#64748b]">{pendingMove.event.petNames}</p>
              </div>

              {/* Time Comparison */}
              <div className="grid grid-cols-2 gap-4">
                {/* Old Time */}
                <div className="rounded-xl border-2 border-[#e5e7eb] bg-[#f9fafb] p-3">
                  <p className="mb-1 text-xs font-semibold text-[#64748b] uppercase">Current Time</p>
                  <p className="text-sm font-medium text-[#1e293b]">
                    {format(pendingMove.event.start, 'MMM d, yyyy')}
                  </p>
                  <p className="text-sm text-[#64748b]">
                    {format(pendingMove.event.start, 'h:mm a')} - {format(pendingMove.event.end, 'h:mm a')}
                  </p>
                </div>

                {/* New Time */}
                <div className="rounded-xl border-2 border-primary-500 bg-[#ecfccb] p-3">
                  <p className="mb-1 text-xs font-semibold text-primary-600 uppercase">New Time</p>
                  <p className="text-sm font-medium text-[#1e293b]">
                    {format(pendingMove.start, 'MMM d, yyyy')}
                  </p>
                  <p className="text-sm text-[#64748b]">
                    {format(pendingMove.start, 'h:mm a')} - {format(pendingMove.end, 'h:mm a')}
                  </p>
                </div>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-3 rounded-xl border-2 border-[#fbbf24] bg-[#fef9c3] p-3">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 text-[#d97706]" />
                <p className="text-sm text-[#92400e]">
                  This will update the appointment time. The client will be notified of the change.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCancelMove}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={handleConfirmMove}
                  disabled={updateAppointment.isPending}
                >
                  {updateAppointment.isPending ? 'Updating...' : 'Confirm'}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  )
}
