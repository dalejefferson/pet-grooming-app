import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventClickArg, EventDropArg, DateSelectArg, EventContentArg } from '@fullcalendar/core'
import type { EventResizeDoneArg } from '@fullcalendar/interaction'
import { format, startOfWeek, endOfWeek, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns'

import { Card, MiniCalendar } from '../../components/common'
import { useAppointmentsByWeek, useClients, usePets, useGroomers, useUpdateAppointmentStatus, useUpdateAppointment, useClientPets, useServices, useCreateAppointment, useDeleteAppointment, useCurrentUser } from '@/hooks'
import { CALENDAR_BUSINESS_HOURS } from '@/config/constants'
import { cn } from '@/lib/utils'
import type { Appointment, AppointmentStatus } from '@/types'
import { useTheme, useKeyboardShortcuts, useUndo } from '../../context'

import {
  HoverPopup,
  CustomEvent,
  CalendarToolbar,
  StatusLegend,
  AppointmentDetailsDrawer,
  CreateAppointmentModal,
  RescheduleConfirmModal,
  StatusChangeModal,
  toFullCalendarEvent,
  fromFullCalendarEvent,
  type CalendarEvent,
  type PendingMove,
  type HoverPosition,
  type PetServiceSelection,
} from '../../components/calendar'

const FC_VIEW_MAP = { day: 'timeGridDay', week: 'timeGridWeek', month: 'dayGridMonth' } as const

export function CalendarPage() {
  const { colors } = useTheme()
  const { data: currentUser } = useCurrentUser()
  const { registerCalendarViewCycle } = useKeyboardShortcuts()
  const { showUndo } = useUndo()
  const [searchParams, setSearchParams] = useSearchParams()
  const calendarRef = useRef<FullCalendar>(null)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'day' | 'week' | 'month'>('month')
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatuses, setSelectedStatuses] = useState<AppointmentStatus[]>([])

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
  const deleteAppointment = useDeleteAppointment()

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

  // Filter events based on search query and status
  const filteredEvents = useMemo(() => {
    let filtered = events

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(
        (event) => event.clientName.toLowerCase().includes(query) || event.petNames.toLowerCase().includes(query)
      )
    }

    // Filter by status (if any selected)
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((event) => selectedStatuses.includes(event.resource.status))
    }

    return filtered
  }, [events, searchQuery, selectedStatuses])

  // Transform events for FullCalendar
  const fcEvents = useMemo(() => filteredEvents.map(toFullCalendarEvent), [filteredEvents])

  // Sync view changes to FullCalendar imperatively
  useEffect(() => {
    const api = calendarRef.current?.getApi()
    if (api) api.changeView(FC_VIEW_MAP[view])
  }, [view])

  // Sync date changes to FullCalendar imperatively
  useEffect(() => {
    const api = calendarRef.current?.getApi()
    if (api) api.gotoDate(currentDate)
  }, [currentDate])

  // Handle ESC key to clear search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && searchQuery) setSearchQuery('')
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchQuery])

  const handleEventClick = useCallback((info: EventClickArg) => {
    setSelectedAppointment(info.event.extendedProps.resource as Appointment)
  }, [])

  const handleViewChange = useCallback((newView: 'day' | 'week' | 'month') => setView(newView), [])

  // Cycle through views: day -> week -> month -> day
  const cycleView = useCallback(() => {
    setView(currentView => {
      if (currentView === 'day') return 'week'
      if (currentView === 'week') return 'month'
      return 'day'
    })
  }, [])

  useEffect(() => {
    registerCalendarViewCycle(cycleView)
    return () => registerCalendarViewCycle(null)
  }, [registerCalendarViewCycle, cycleView])

  // Handle book query param from keyboard shortcut
  useEffect(() => {
    if (searchParams.get('book') === 'true') {
      setShowCreateModal(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

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

  const handleEventDrop = useCallback((info: EventDropArg) => {
    setIsDragging(false)
    if (!info.event.start || !info.event.end) { info.revert(); return }
    const calEvent = fromFullCalendarEvent(info.event)
    setPendingMove({ event: calEvent, start: info.event.start, end: info.event.end, isResize: false, revert: info.revert })
    setShowMoveConfirmModal(true)
  }, [])

  const handleEventResize = useCallback((info: EventResizeDoneArg) => {
    setIsDragging(false)
    if (!info.event.start || !info.event.end) { info.revert(); return }
    const calEvent = fromFullCalendarEvent(info.event)
    setPendingMove({ event: calEvent, start: info.event.start, end: info.event.end, isResize: true, revert: info.revert })
    setShowMoveConfirmModal(true)
  }, [])

  const handleConfirmMove = useCallback(async () => {
    if (!pendingMove) return
    try { await updateAppointment.mutateAsync({ id: pendingMove.event.resource.id, data: { startTime: pendingMove.start.toISOString(), endTime: pendingMove.end.toISOString() } }) } catch { /* Error handled by react-query */ }
    setPendingMove(null)
    setShowMoveConfirmModal(false)
  }, [pendingMove, updateAppointment])

  const handleCancelMove = useCallback(() => {
    pendingMove?.revert()
    setPendingMove(null)
    setShowMoveConfirmModal(false)
  }, [pendingMove])

  // Create appointment handlers
  const handleDateSelect = useCallback((info: DateSelectArg) => {
    setCreateStartTime(format(info.start, "yyyy-MM-dd'T'HH:mm"))
    setCreateEndTime(format(info.end, "yyyy-MM-dd'T'HH:mm"))
    setSelectedClientId('')
    setShowCreateModal(true)
    calendarRef.current?.getApi().unselect()
  }, [])

  const handleCreateAppointment = useCallback(async (data: { clientId: string; petServices: PetServiceSelection[]; groomerId: string; notes: string; startTime: string; endTime: string }) => {
    try {
      await createAppointment.mutateAsync({
        organizationId: currentUser?.organizationId || '',
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

  // Delete appointment handler with undo support
  const handleDeleteAppointment = useCallback(async (appointmentId: string) => {
    const appointment = appointments.find(a => a.id === appointmentId)
    if (!appointment) return

    const client = clients.find(c => c.id === appointment.clientId)
    const petNames = appointment.pets.map(p => pets.find(pet => pet.id === p.petId)?.name).filter(Boolean).join(', ')

    await deleteAppointment.mutateAsync(appointmentId)
    setSelectedAppointment(null)

    showUndo({
      type: 'appointment',
      label: client ? `${client.firstName} ${client.lastName} - ${petNames}` : 'Appointment',
      data: appointment,
      onUndo: async () => {
        await createAppointment.mutateAsync({
          organizationId: appointment.organizationId,
          clientId: appointment.clientId,
          pets: appointment.pets,
          groomerId: appointment.groomerId,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          status: appointment.status,
          internalNotes: appointment.internalNotes,
          clientNotes: appointment.clientNotes,
          statusNotes: appointment.statusNotes,
          depositPaid: appointment.depositPaid,
          depositAmount: appointment.depositAmount,
          totalAmount: appointment.totalAmount,
        })
      },
    })
  }, [appointments, clients, pets, deleteAppointment, createAppointment, showUndo])

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

  // FullCalendar custom event content renderer
  const renderEventContent = useCallback((eventInfo: EventContentArg) => {
    const calEvent = fromFullCalendarEvent(eventInfo.event)
    return (
      <CustomEvent
        event={calEvent}
        view={eventInfo.view.type}
        onMouseEnter={handleEventMouseEnter}
        onMouseLeave={handleEventMouseLeave}
      />
    )
  }, [handleEventMouseEnter, handleEventMouseLeave])

  return (
    <div className={cn('min-h-screen p-4 lg:p-6 flex flex-col', colors.pageGradientLight)}>
      <div className="flex flex-col gap-6 flex-1 min-h-0">
        <CalendarToolbar
          view={view}
          searchQuery={searchQuery}
          filteredEventsCount={filteredEvents.length}
          totalEventsCount={events.length}
          selectedStatuses={selectedStatuses}
          onPrevious={goToPrev}
          onNext={goToNext}
          onToday={goToToday}
          onViewChange={(v) => handleViewChange(v)}
          onSearchChange={setSearchQuery}
          onStatusFilterChange={setSelectedStatuses}
          getDisplayDate={getDisplayDate}
        />

        <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
          {(view === 'day' || view === 'week') && (
            <div className="flex-shrink-0 w-full lg:w-auto">
              <MiniCalendar currentMonth={miniCalendarMonth} selectedDate={currentDate} weekRange={weekRange} onDateSelect={handleMiniCalendarDateSelect} onMonthChange={handleMiniCalendarMonthChange} />
            </div>
          )}

          <Card padding="none" className={cn('flex-1 min-h-0 bg-white/80 backdrop-blur-sm', isDragging && 'cursor-grabbing')}>
            <div className="p-2 sm:p-4 h-full min-h-[500px] overflow-x-auto">
              <div className="min-w-[600px] h-full">
                <FullCalendar
                  ref={calendarRef}
                  plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  headerToolbar={false}
                  events={fcEvents}
                  eventContent={renderEventContent}
                  eventClick={handleEventClick}
                  eventDrop={handleEventDrop}
                  eventResize={handleEventResize}
                  eventDragStart={handleDragStart}
                  select={handleDateSelect}
                  selectable={true}
                  editable={true}
                  slotMinTime={`${String(CALENDAR_BUSINESS_HOURS.start).padStart(2, '0')}:00:00`}
                  slotMaxTime={`${String(CALENDAR_BUSINESS_HOURS.end).padStart(2, '0')}:00:00`}
                  slotDuration="00:15:00"
                  slotLabelInterval="01:00:00"
                  dayMaxEvents={true}
                  height="100%"
                  expandRows={true}
                  nowIndicator={true}
                  eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
                  firstDay={0}
                />
              </div>
            </div>
          </Card>
        </div>

        <StatusLegend />

        {hoveredAppointment && hoverPosition && <HoverPopup appointment={hoveredAppointment} position={hoverPosition} clients={clients} pets={pets} groomers={groomers} />}

        <AppointmentDetailsDrawer appointment={selectedAppointment} onClose={() => setSelectedAppointment(null)} clients={clients} pets={pets} groomers={groomers} onStatusChange={handleStatusChange} onQuickStatusChange={handleQuickStatusChange} onDelete={handleDeleteAppointment} isDeleting={deleteAppointment.isPending} />

        <CreateAppointmentModal isOpen={showCreateModal} onClose={handleCloseCreateModal} clients={clients} clientPets={clientPets} services={services} groomers={groomers} initialStartTime={createStartTime} initialEndTime={createEndTime} onClientChange={setSelectedClientId} selectedClientId={selectedClientId} onCreateAppointment={handleCreateAppointment} isCreating={createAppointment.isPending} />

        <RescheduleConfirmModal isOpen={showMoveConfirmModal} onClose={handleCancelMove} pendingMove={pendingMove} onConfirm={handleConfirmMove} isUpdating={updateAppointment.isPending} />

        <StatusChangeModal isOpen={showStatusNotesModal} onClose={handleCancelStatusNotes} pendingStatus={pendingStatusChange} notes={statusNotes} onNotesChange={setStatusNotes} onConfirm={handleConfirmStatusWithNotes} isUpdating={updateStatus.isPending} />
      </div>
    </div>
  )
}
