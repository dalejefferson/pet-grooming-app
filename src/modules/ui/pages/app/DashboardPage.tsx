import { useState, useCallback, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Users, Dog, Clock, TrendingUp, AlertCircle, UserX, XCircle } from 'lucide-react'
import { Card, CardTitle, Badge } from '../../components/common'
import { AppointmentDetailsDrawer, StatusChangeModal } from '../../components/calendar'
import { VaccinationAlertsWidget } from '../../components/dashboard'
import { useAppointmentsByDay, useAppointmentsByDateRange, useClients, usePets, useGroomers, useUpdateAppointmentStatus, useDeleteAppointment, useCreateAppointment } from '@/hooks'
import { useUndo } from '@/modules/ui/context'
import { format, subDays, startOfDay } from 'date-fns'
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_COLORS } from '@/config/constants'
import { cn } from '@/lib/utils'
import { useTheme, useKeyboardShortcuts } from '../../context'
import type { AppointmentStatus, Appointment } from '@/types'

export function DashboardPage() {
  const { colors } = useTheme()
  const { registerDashboardCycle } = useKeyboardShortcuts()
  const { showUndo } = useUndo()
  const today = new Date()
  const { data: todayAppointments = [] } = useAppointmentsByDay(today)
  const { data: clients = [] } = useClients()
  const { data: pets = [] } = usePets()
  const { data: groomers = [] } = useGroomers()

  // Appointment editing state
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [showStatusNotesModal, setShowStatusNotesModal] = useState(false)
  const [pendingStatusChange, setPendingStatusChange] = useState<'no_show' | 'cancelled' | null>(null)
  const [statusNotes, setStatusNotes] = useState('')

  // Mutations
  const updateStatus = useUpdateAppointmentStatus()
  const deleteAppointment = useDeleteAppointment()
  const createAppointment = useCreateAppointment()

  const [selectedStatuses, setSelectedStatuses] = useState<AppointmentStatus[]>([
    'requested', 'confirmed', 'checked_in', 'in_progress'
  ])

  // Issues (No-Shows & Cancellations) range state
  const [issuesRange, setIssuesRange] = useState<'today' | '7days' | '30days'>('today')

  // Cycle through dashboard issue ranges: today -> 7days -> 30days -> today
  const cycleDashboardRange = useCallback(() => {
    setIssuesRange(current => {
      if (current === 'today') return '7days'
      if (current === '7days') return '30days'
      return 'today'
    })
  }, [])

  useEffect(() => {
    registerDashboardCycle(cycleDashboardRange)
  }, [registerDashboardCycle, cycleDashboardRange])

  const issuesDateRange = useMemo(() => {
    const endDate = new Date()
    if (issuesRange === 'today') return { start: startOfDay(endDate), end: endDate }
    if (issuesRange === '7days') return { start: subDays(endDate, 7), end: endDate }
    return { start: subDays(endDate, 30), end: endDate }
  }, [issuesRange])

  const { data: issuesAppointments = [] } = useAppointmentsByDateRange(issuesDateRange.start, issuesDateRange.end)

  const noShowAppointments = useMemo(
    () => issuesAppointments.filter(a => a.status === 'no_show'),
    [issuesAppointments]
  )
  const cancelledAppointments = useMemo(
    () => issuesAppointments.filter(a => a.status === 'cancelled'),
    [issuesAppointments]
  )

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

  const handleQuickStatusChange = (status: 'no_show' | 'cancelled') => {
    if (!selectedAppointment) return
    setPendingStatusChange(status)
    setStatusNotes(selectedAppointment.statusNotes || '')
    setShowStatusNotesModal(true)
  }

  const handleConfirmStatusWithNotes = async () => {
    if (!selectedAppointment || !pendingStatusChange) return
    await updateStatus.mutateAsync({ id: selectedAppointment.id, status: pendingStatusChange, statusNotes: statusNotes || undefined })
    setSelectedAppointment((prev) => (prev ? { ...prev, status: pendingStatusChange, statusNotes: statusNotes || undefined } : null))
    setShowStatusNotesModal(false)
    setPendingStatusChange(null)
    setStatusNotes('')
  }

  const handleCancelStatusNotes = () => {
    setShowStatusNotesModal(false)
    setPendingStatusChange(null)
    setStatusNotes('')
  }

  const handleDeleteAppointment = useCallback(async (appointmentId: string) => {
    const appointment = todayAppointments.find(a => a.id === appointmentId)
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
          depositPaid: appointment.depositPaid,
          totalAmount: appointment.totalAmount,
        })
      },
    })
  }, [todayAppointments, clients, pets, deleteAppointment, createAppointment, showUndo])

  const upcomingAppointments = todayAppointments
    .filter((a) => selectedStatuses.length === 0 || selectedStatuses.includes(a.status))

  const todayDateParam = format(today, 'yyyy-MM-dd')

  const stats = [
    {
      label: "Today's Appointments",
      value: todayAppointments.length,
      icon: Calendar,
      color: 'text-primary-600 bg-primary-100',
      link: `/app/calendar?date=${todayDateParam}`,
    },
    {
      label: 'Total Clients',
      value: clients.length,
      icon: Users,
      color: 'text-green-600 bg-green-100',
      link: '/app/clients',
    },
    {
      label: 'Total Pets',
      value: pets.length,
      icon: Dog,
      color: 'text-purple-600 bg-purple-100',
      link: '/app/pets',
    },
    {
      label: 'Pending Requests',
      value: todayAppointments.filter((a) => a.status === 'requested').length,
      icon: AlertCircle,
      color: 'text-yellow-600 bg-yellow-100',
      link: `/app/calendar?date=${todayDateParam}&filter=requested`,
    },
  ]

  return (
    <div className={cn('min-h-screen p-4 lg:p-6', colors.pageGradientLight)}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">{format(today, 'EEEE, MMMM d, yyyy')}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.link}>
            <Card className="cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#1e293b]">
              <div className="flex items-center gap-4">
                <div className={cn('rounded-lg p-3', stat.color)}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Today's Schedule */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <CardTitle>Today's Schedule</CardTitle>
          <Link
            to="/app/calendar"
            className="text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            View Calendar
          </Link>
        </div>

        {/* Status Filter Buttons */}
        <div className="mb-4 flex flex-wrap gap-2">
          {(['requested', 'confirmed', 'checked_in', 'in_progress', 'completed', 'cancelled', 'no_show'] as AppointmentStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => {
                setSelectedStatuses(prev =>
                  prev.includes(status)
                    ? prev.filter(s => s !== status)
                    : [...prev, status]
                )
              }}
              aria-label={`${selectedStatuses.includes(status) ? 'Hide' : 'Show'} ${APPOINTMENT_STATUS_LABELS[status].toLowerCase()} appointments`}
              aria-pressed={selectedStatuses.includes(status)}
              className={cn(
                'rounded-lg border-2 border-[#1e293b] px-3 py-1 text-xs font-medium transition-all cursor-pointer',
                selectedStatuses.includes(status)
                  ? `${APPOINTMENT_STATUS_COLORS[status]} shadow-[2px_2px_0px_0px_#1e293b]`
                  : 'bg-white text-gray-500 hover:bg-gray-50'
              )}
            >
              {APPOINTMENT_STATUS_LABELS[status]}
            </button>
          ))}
        </div>

        {upcomingAppointments.length === 0 ? (
          <div className="py-8 text-center">
            <Clock className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-600">No upcoming appointments today</p>
          </div>
        ) : (
          <div className="max-h-[280px] overflow-y-auto space-y-3">
            {upcomingAppointments.map((appointment) => {
              const client = clients.find(c => c.id === appointment.clientId)
              const appointmentPets = appointment.pets.map(p => pets.find(pet => pet.id === p.petId)).filter(Boolean)
              return (
                <button
                  key={appointment.id}
                  onClick={() => setSelectedAppointment(appointment)}
                  className="w-full flex items-center justify-between rounded-xl border-2 border-[#1e293b] bg-white p-3 shadow-[2px_2px_0px_0px_#1e293b] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#1e293b] text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-lg font-semibold text-gray-900">
                        {format(new Date(appointment.startTime), 'h:mm')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(appointment.startTime), 'a')}
                      </p>
                    </div>
                    <div className="h-10 w-px bg-gray-200" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {appointmentPets.map(p => p?.name).join(', ') || `${appointment.pets.length} pet${appointment.pets.length > 1 ? 's' : ''}`}
                      </p>
                      <p className="text-sm text-gray-600">
                        {client ? `${client.firstName} ${client.lastName}` : `Client #${appointment.clientId.split('-')[1]}`}
                      </p>
                    </div>
                  </div>
                  <Badge
                    className={cn(APPOINTMENT_STATUS_COLORS[appointment.status])}
                  >
                    {APPOINTMENT_STATUS_LABELS[appointment.status]}
                  </Badge>
                </button>
              )
            })}
          </div>
        )}
      </Card>

      {/* Vaccination Alerts & Quick Actions Row */}
      <div className="grid gap-6 lg:grid-cols-2 items-start">
        <VaccinationAlertsWidget />
        <div className="space-y-4">
          {/* Quick Actions Card */}
          <Card>
            <CardTitle>Quick Actions</CardTitle>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link
                to="/app/calendar"
                className="flex items-center gap-3 rounded-xl border-2 border-[#1e293b] bg-white p-4 shadow-[3px_3px_0px_0px_#1e293b] transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#1e293b]"
              >
                <Calendar className="h-5 w-5" style={{ color: colors.accentColorDark }} />
                <span className="font-medium text-gray-900">View Calendar</span>
              </Link>
              <Link
                to="/app/clients"
                className="flex items-center gap-3 rounded-xl border-2 border-[#1e293b] bg-white p-4 shadow-[3px_3px_0px_0px_#1e293b] transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#1e293b]"
              >
                <Users className="h-5 w-5" style={{ color: colors.accentColorDark }} />
                <span className="font-medium text-gray-900">Manage Clients</span>
              </Link>
              <Link
                to="/app/services"
                className="flex items-center gap-3 rounded-xl border-2 border-[#1e293b] bg-white p-4 shadow-[3px_3px_0px_0px_#1e293b] transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#1e293b]"
              >
                <TrendingUp className="h-5 w-5" style={{ color: colors.accentColorDark }} />
                <span className="font-medium text-gray-900">Edit Services</span>
              </Link>
              <Link
                to={`/book/paws-claws/start`}
                target="_blank"
                className="flex items-center gap-3 rounded-xl border-2 border-[#1e293b] bg-white p-4 shadow-[3px_3px_0px_0px_#1e293b] transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_0px_#1e293b]"
              >
                <Dog className="h-5 w-5" style={{ color: colors.accentColorDark }} />
                <span className="font-medium text-gray-900">Booking Portal</span>
              </Link>
            </div>
          </Card>

          {/* Issues Range Toggle */}
          <div className="flex justify-end">
            <div className="flex items-center gap-0.5 rounded-xl border-2 border-[#1e293b] bg-white p-0.5 shadow-[2px_2px_0px_0px_#1e293b]">
              {(['today', '7days', '30days'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setIssuesRange(range)}
                  className={cn(
                    'rounded-lg border-2 px-3 py-1.5 text-sm font-semibold transition-all cursor-pointer text-center',
                    issuesRange === range
                      ? 'shadow-[1px_1px_0px_0px_#1e293b] border-[#1e293b]'
                      : 'border-transparent bg-transparent text-[#334155] hover:bg-[var(--accent-color-light)]'
                  )}
                  style={issuesRange === range ? { backgroundColor: colors.accentColorDark, color: 'var(--text-on-accent)' } : undefined}
                >
                  {range === 'today' ? 'Today' : range === '7days' ? '7 Days' : '30 Days'}
                </button>
              ))}
            </div>
          </div>

          {/* No-Shows & Cancellations Cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            {/* No-Shows Card */}
            <Card className="border-[#f472b6] bg-[#fce7f3]/30">
              <div className="flex items-center gap-2 mb-3">
                <div className="rounded-lg border-2 border-[#f472b6] bg-[#fce7f3] p-2">
                  <UserX className="h-4 w-4 text-[#9d174d]" />
                </div>
                <span className="font-semibold text-[#9d174d]">No-Shows</span>
                <Badge className="ml-auto bg-[#fce7f3] text-[#9d174d] border-[#f472b6]">
                  {noShowAppointments.length}
                </Badge>
              </div>
              {noShowAppointments.length === 0 ? (
                <p className="text-sm text-[#9d174d]/60 py-2">No no-shows in this period</p>
              ) : (
                <div className="max-h-[160px] overflow-y-auto space-y-2">
                  {noShowAppointments.map((apt) => {
                    const client = clients.find(c => c.id === apt.clientId)
                    const petNames = apt.pets.map(p => pets.find(pet => pet.id === p.petId)?.name).filter(Boolean).join(', ')
                    return (
                      <button
                        key={apt.id}
                        onClick={() => setSelectedAppointment(apt)}
                        className="w-full text-left rounded-lg border border-[#f472b6] bg-white p-2 hover:bg-[#fce7f3]/50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{petNames || 'Unknown Pet'}</p>
                            <p className="text-xs text-gray-600">{client ? `${client.firstName} ${client.lastName}` : 'Unknown Client'}</p>
                          </div>
                          <span className="text-xs text-gray-500">{format(new Date(apt.startTime), 'MMM d')}</span>
                        </div>
                        {apt.statusNotes && (
                          <p className="text-xs text-[#9d174d] mt-1 truncate">{apt.statusNotes}</p>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </Card>

            {/* Cancellations Card */}
            <Card className="border-[#9ca3af] bg-[#e5e7eb]/30">
              <div className="flex items-center gap-2 mb-3">
                <div className="rounded-lg border-2 border-[#9ca3af] bg-[#e5e7eb] p-2">
                  <XCircle className="h-4 w-4 text-[#374151]" />
                </div>
                <span className="font-semibold text-[#374151]">Cancellations</span>
                <Badge className="ml-auto bg-[#e5e7eb] text-[#374151] border-[#9ca3af]">
                  {cancelledAppointments.length}
                </Badge>
              </div>
              {cancelledAppointments.length === 0 ? (
                <p className="text-sm text-[#374151]/60 py-2">No cancellations in this period</p>
              ) : (
                <div className="max-h-[160px] overflow-y-auto space-y-2">
                  {cancelledAppointments.map((apt) => {
                    const client = clients.find(c => c.id === apt.clientId)
                    const petNames = apt.pets.map(p => pets.find(pet => pet.id === p.petId)?.name).filter(Boolean).join(', ')
                    return (
                      <button
                        key={apt.id}
                        onClick={() => setSelectedAppointment(apt)}
                        className="w-full text-left rounded-lg border border-[#9ca3af] bg-white p-2 hover:bg-[#e5e7eb]/50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{petNames || 'Unknown Pet'}</p>
                            <p className="text-xs text-gray-600">{client ? `${client.firstName} ${client.lastName}` : 'Unknown Client'}</p>
                          </div>
                          <span className="text-xs text-gray-500">{format(new Date(apt.startTime), 'MMM d')}</span>
                        </div>
                        {apt.statusNotes && (
                          <p className="text-xs text-[#374151] mt-1 truncate">{apt.statusNotes}</p>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
      </div>

      {/* Appointment Details Drawer */}
      <AppointmentDetailsDrawer
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        clients={clients}
        pets={pets}
        groomers={groomers}
        onStatusChange={handleStatusChange}
        onQuickStatusChange={handleQuickStatusChange}
        onDelete={handleDeleteAppointment}
        isDeleting={deleteAppointment.isPending}
      />

      {/* Status Change Modal for No Show / Cancelled */}
      <StatusChangeModal
        isOpen={showStatusNotesModal}
        onClose={handleCancelStatusNotes}
        pendingStatus={pendingStatusChange}
        notes={statusNotes}
        onNotesChange={setStatusNotes}
        onConfirm={handleConfirmStatusWithNotes}
        isUpdating={updateStatus.isPending}
      />
    </div>
  )
}
