import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Users, Dog, Clock, TrendingUp, AlertCircle } from 'lucide-react'
import { Card, CardTitle, Badge } from '../../components/common'
import { useAppointmentsByDay, useClients, usePets } from '@/hooks'
import { format } from 'date-fns'
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_COLORS } from '@/config/constants'
import { cn } from '@/lib/utils'
import { useTheme } from '../../context'
import type { AppointmentStatus } from '@/types'

export function DashboardPage() {
  const { colors } = useTheme()
  const today = new Date()
  const { data: todayAppointments = [] } = useAppointmentsByDay(today)
  const { data: clients = [] } = useClients()
  const { data: pets = [] } = usePets()

  const [selectedStatuses, setSelectedStatuses] = useState<AppointmentStatus[]>([
    'requested', 'confirmed', 'checked_in', 'in_progress'
  ])

  const upcomingAppointments = todayAppointments
    .filter((a) => selectedStatuses.length === 0 || selectedStatuses.includes(a.status))
    .slice(0, 5)

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
          <div className="space-y-3">
            {upcomingAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
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
                      {appointment.pets.length} pet{appointment.pets.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-gray-600">
                      Client #{appointment.clientId.split('-')[1]}
                    </p>
                  </div>
                </div>
                <Badge
                  className={cn(APPOINTMENT_STATUS_COLORS[appointment.status])}
                >
                  {APPOINTMENT_STATUS_LABELS[appointment.status]}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardTitle>Quick Actions</CardTitle>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
      </div>
    </div>
  )
}
