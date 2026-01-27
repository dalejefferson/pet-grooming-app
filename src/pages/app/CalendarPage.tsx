import { useState, useCallback, useMemo, useEffect } from 'react'
import { Calendar, dateFnsLocalizer, type View, type Components, type SlotInfo } from 'react-big-calendar'
import withDragAndDrop, { type EventInteractionArgs } from 'react-big-calendar/lib/addons/dragAndDrop'
import { format, parse, startOfWeek, endOfWeek, getDay, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns'
import { enUS } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css'

import { Card, MiniCalendar } from '@/components/common'
import { useAppointmentsByWeek, useClients, usePets, useGroomers, useUpdateAppointmentStatus, useUpdateAppointment, useClientPets, useServices, useCreateAppointment } from '@/hooks'
import { CALENDAR_BUSINESS_HOURS } from '@/config/constants'
import { cn } from '@/lib/utils'
import type { Appointment, AppointmentStatus } from '@/types'
import { useTheme } from '@/context/ThemeContext'

import {
  HoverPopup,
  CustomEvent,
  CalendarToolbar,
  StatusLegend,
  AppointmentDetailsDrawer,
  CreateAppointmentModal,
  RescheduleConfirmModal,
  StatusChangeModal,
  STATUS_BG_COLORS,
  STATUS_BORDER_COLORS,
  STATUS_TEXT_COLORS,
  type CalendarEvent,
  type PendingMove,
  type HoverPosition,
  type PetServiceSelection,
} from '@/components/calendar'

const locales = { 'en-US': enUS }

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

// Create the drag-and-drop enabled calendar
const DragAndDropCalendar = withDragAndDrop<CalendarEvent, object>(Calendar)

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
  const [createStartTime, setCreateStartTime] = useState<string>('')
  const [createEndTime, setCreateEndTime] = useState<string>('')

  // Mini calendar state
  const [miniCalendarMonth, setMiniCalendarMonth] = useState(new Date())

  // Status change with notes state
  const [showStatusNotesModal, setShowStatusNotesModal] = useState(false)
  const [pendingStatusChange, setPendingStatusChange] = useState<AppointmentStatus | null>(null)
  const [statusNotes, setStatusNotes] = useState('')

  const { data: appointments = [] } = useAppointmentsByWeek(currentDate)
  const { data: clients = [] } = useClients()
  const { data: pets = [] } = usePets()
  const { data: groomers = [] } = useGroomers()
  const { data: services = [] } = useServices()
  const { data: clientPets = [] } = useClientPets(selectedClientId)
  const updateStatus = useUpdateAppointmentStatus()
  const updateAppointment = useUpdateAppointment()
  const createAppointment = useCreateAppointment()

  // Build calendar events from appointments
  const events: CalendarEvent[] = useMemo(() => {
    return appointments.map((apt) => {
      const client = clients.find((c) => c.id === apt.clientId)
      const petNames = apt.pets.map((p) => pets.find((pet) => pet.id === p.petId)?.name).filter(Boolean).join(', ')
      const serviceSummary = apt.pets.flatMap((p) => p.services.map(() => 'Grooming')).slice(0, 2).join(', ') + (apt.pets.flatMap((p) => p.services).length > 2 ? '...' : '')
      return {
        id: apt.id,
        title: client ? `${client.firstName} ${client.lastName} - ${petNames || 'Pet'}` : `Appointment - ${petNames || 'Pet'}`,
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
    if (!searchQuery.trim()) return events
    const query = searchQuery.toLowerCase().trim()
    return events.filter((event) => event.clientName.toLowerCase().includes(query) || event.petNames.toLowerCase().includes(query))
  }, [events, searchQuery])

  // Handle ESC key to clear search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchQuery) setSearchQuery('')
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchQuery])

  const handleSelectEvent = useCallback((event: CalendarEvent) => setSelectedAppointment(event.resource), [])
  const handleNavigate = useCallback((date: Date) => setCurrentDate(date), [])
  const handleViewChange = useCallback((newView: View) => setView(newView), [])

  // Status change handlers
  const handleStatusChange = async (status: AppointmentStatus) => {
    if (!selectedAppointment) return
    if (status === 'no_show' || status === 'cancelled') {
      setPendingStatusChange(status)
      setStatusNotes(selectedAppointment.statusNotes || '')
      setShowStatusNotesModal(true)
    } else {
      await updateStatus.mutateAsync({ id: selectedAppointment.id, status, statusNotes: undefined })
      setSelectedAppointment((prev) => (prev ? { ...prev, status, statusNotes: undefined } : null))
    }
  }

  const handleConfirmStatusWithNotes = async () => {
    if (!selectedAppointment || !pendingStatusChange) return
    await updateStatus.mutateAsync({ id: selectedAppointment.id, status: pendingStatusChange, statusNotes: statusNotes || undefined })
    setSelectedAppointment((prev) => (prev ? { ...prev, status: pendingStatusChange, statusNotes: statusNotes || undefined } : null))
    setShowStatusNotesModal(false)
    setPendingStatusChange(null)
    setStatusNotes('')
  }

  const handleQuickStatusChange = (status: 'no_show' | 'cancelled') => {
    if (!selectedAppointment) return
    setPendingStatusChange(status)
    setStatusNotes(selectedAppointment.statusNotes || '')
    setShowStatusNotesModal(true)
  }

  const handleCancelStatusNotes = () => { setShowStatusNotesModal(false); setPendingStatusChange(null); setStatusNotes('') }

  // Navigation handlers
  const goToPrev = useCallback(() => {
    if (view === 'month') setCurrentDate((d) => subMonths(d, 1))
    else if (view === 'week') setCurrentDate((d) => subWeeks(d, 1))
    else setCurrentDate((d) => subDays(d, 1))
  }, [view])

  const goToNext = useCallback(() => {
    if (view === 'month') setCurrentDate((d) => addMonths(d, 1))
    else if (view === 'week') setCurrentDate((d) => addWeeks(d, 1))
    else setCurrentDate((d) => addDays(d, 1))
  }, [view])

  const goToToday = useCallback(() => setCurrentDate(new Date()), [])

  const handleMiniCalendarDateSelect = useCallback((date: Date) => setCurrentDate(date), [])
  const handleMiniCalendarMonthChange = useCallback((date: Date) => setMiniCalendarMonth(date), [])

  const weekRange = useMemo(() => {
    if (view !== 'week') return undefined
    return { start: startOfWeek(currentDate, { weekStartsOn: 0 }), end: endOfWeek(currentDate, { weekStartsOn: 0 }) }
  }, [currentDate, view])

  // Hover handlers
  const handleEventMouseEnter = useCallback((event: CalendarEvent, e: React.MouseEvent) => {
    if (isDragging) return
    setHoveredAppointment(event.resource)
    setHoverPosition({ x: e.clientX, y: e.clientY })
  }, [isDragging])

  const handleEventMouseLeave = useCallback(() => { setHoveredAppointment(null); setHoverPosition(null) }, [])

  // Drag and drop handlers
  const handleDragStart = useCallback(() => { setIsDragging(true); setSelectedAppointment(null); setHoveredAppointment(null); setHoverPosition(null) }, [])

  const handleEventDrop = useCallback(({ event, start, end }: EventInteractionArgs<CalendarEvent>) => {
    setIsDragging(false)
    if (event.start.getTime() === new Date(start).getTime() && event.end.getTime() === new Date(end).getTime()) return
    setPendingMove({ event, start: new Date(start), end: new Date(end), isResize: false })
    setShowMoveConfirmModal(true)
  }, [])

  const handleEventResize = useCallback(({ event, start, end }: EventInteractionArgs<CalendarEvent>) => {
    setIsDragging(false)
    if (event.start.getTime() === new Date(start).getTime() && event.end.getTime() === new Date(end).getTime()) return
    setPendingMove({ event, start: new Date(start), end: new Date(end), isResize: true })
    setShowMoveConfirmModal(true)
  }, [])

  const handleConfirmMove = useCallback(async () => {
    if (!pendingMove) return
    try { await updateAppointment.mutateAsync({ id: pendingMove.event.resource.id, data: { startTime: pendingMove.start.toISOString(), endTime: pendingMove.end.toISOString() } }) } catch { /* Error handled by react-query */ }
    setPendingMove(null)
    setShowMoveConfirmModal(false)
  }, [pendingMove, updateAppointment])

  const handleCancelMove = useCallback(() => { setPendingMove(null); setShowMoveConfirmModal(false) }, [])

  // Create appointment handlers
  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    setCreateStartTime(format(slotInfo.start, "yyyy-MM-dd'T'HH:mm"))
    setCreateEndTime(format(slotInfo.end, "yyyy-MM-dd'T'HH:mm"))
    setSelectedClientId('')
    setShowCreateModal(true)
  }, [])

  const handleCreateAppointment = useCallback(async (data: { clientId: string; petServices: PetServiceSelection[]; groomerId: string; notes: string; startTime: string; endTime: string }) => {
    try {
      await createAppointment.mutateAsync({
        organizationId: 'org-1',
        clientId: data.clientId,
        pets: data.petServices.filter((ps) => ps.serviceIds.length > 0).map((ps) => ({
          petId: ps.petId,
          services: ps.serviceIds.map((serviceId) => {
            const service = services.find((s) => s.id === serviceId)
            return { serviceId, appliedModifiers: [], finalDuration: service?.baseDurationMinutes || 60, finalPrice: service?.basePrice || 0 }
          }),
        })),
        groomerId: data.groomerId || undefined,
        startTime: new Date(data.startTime).toISOString(),
        endTime: new Date(data.endTime).toISOString(),
        status: 'confirmed' as AppointmentStatus,
        internalNotes: data.notes || undefined,
        depositPaid: false,
        totalAmount: data.petServices.reduce((total, ps) => total + ps.serviceIds.reduce((sum, sid) => sum + (services.find((s) => s.id === sid)?.basePrice || 0), 0), 0),
      })
      setShowCreateModal(false)
      setSelectedClientId('')
    } catch { /* Error handled by react-query */ }
  }, [createAppointment, services])

  const handleCloseCreateModal = useCallback(() => { setShowCreateModal(false); setSelectedClientId('') }, [])

  // Display date formatter
  const getDisplayDate = useCallback(() => {
    if (view === 'month') return format(currentDate, 'MMMM yyyy')
    if (view === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
      const weekEnd = addDays(weekStart, 6)
      if (format(weekStart, 'MMMM') === format(weekEnd, 'MMMM')) return `${format(weekStart, 'MMMM d')} - ${format(weekEnd, 'd, yyyy')}`
      return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
    }
    return format(currentDate, 'EEEE, MMMM d, yyyy')
  }, [currentDate, view])

  // Event style getter
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

  // Event wrapper component
  const EventWrapper = useCallback(
    ({ event }: { event: CalendarEvent }) => <CustomEvent event={event} onMouseEnter={handleEventMouseEnter} onMouseLeave={handleEventMouseLeave} />,
    [handleEventMouseEnter, handleEventMouseLeave]
  )

  const components: Components<CalendarEvent, object> = useMemo(() => ({ event: EventWrapper, toolbar: () => null }), [EventWrapper])

  return (
    <div className={cn('min-h-screen', colors.pageGradientLight)}>
      <div className="space-y-6">
        <CalendarToolbar
          view={view as 'day' | 'week' | 'month'}
          searchQuery={searchQuery}
          filteredEventsCount={filteredEvents.length}
          totalEventsCount={events.length}
          onPrevious={goToPrev}
          onNext={goToNext}
          onToday={goToToday}
          onViewChange={(v) => handleViewChange(v)}
          onSearchChange={setSearchQuery}
          getDisplayDate={getDisplayDate}
        />

        <StatusLegend />

        <div className="flex flex-col lg:flex-row gap-4">
          {(view === 'day' || view === 'week') && (
            <div className="flex-shrink-0 w-full lg:w-auto">
              <MiniCalendar currentMonth={miniCalendarMonth} selectedDate={currentDate} weekRange={weekRange} onDateSelect={handleMiniCalendarDateSelect} onMonthChange={handleMiniCalendarMonthChange} />
            </div>
          )}

          <Card padding="none" className={cn('flex-1 overflow-hidden bg-white/80 backdrop-blur-sm', isDragging && 'cursor-grabbing')}>
            <div className="p-2 sm:p-4 overflow-x-auto" style={{ height: view === 'month' ? 'calc(100vh - 380px)' : 'calc(100vh - 440px)', minHeight: view === 'month' ? '500px' : '400px' }}>
              <div className="min-w-[600px] h-full">
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
            </div>
          </Card>
        </div>

        {hoveredAppointment && hoverPosition && <HoverPopup appointment={hoveredAppointment} position={hoverPosition} clients={clients} pets={pets} groomers={groomers} />}

        <AppointmentDetailsDrawer appointment={selectedAppointment} onClose={() => setSelectedAppointment(null)} clients={clients} pets={pets} groomers={groomers} onStatusChange={handleStatusChange} onQuickStatusChange={handleQuickStatusChange} />

        <CreateAppointmentModal isOpen={showCreateModal} onClose={handleCloseCreateModal} clients={clients} clientPets={clientPets} services={services} groomers={groomers} initialStartTime={createStartTime} initialEndTime={createEndTime} onClientChange={setSelectedClientId} selectedClientId={selectedClientId} onCreateAppointment={handleCreateAppointment} isCreating={createAppointment.isPending} />

        <RescheduleConfirmModal isOpen={showMoveConfirmModal} onClose={handleCancelMove} pendingMove={pendingMove} onConfirm={handleConfirmMove} isUpdating={updateAppointment.isPending} />

        <StatusChangeModal isOpen={showStatusNotesModal} onClose={handleCancelStatusNotes} pendingStatus={pendingStatusChange} notes={statusNotes} onNotesChange={setStatusNotes} onConfirm={handleConfirmStatusWithNotes} isUpdating={updateStatus.isPending} />
      </div>
    </div>
  )
}
