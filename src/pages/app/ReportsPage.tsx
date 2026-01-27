import { useState, useMemo } from 'react'
import { Download, Calendar, TrendingUp, Users, Scissors } from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card, CardTitle, Button } from '@/components/common'
import { useAppointments, useClients, useServices } from '@/hooks'
import { format, subDays, parseISO, isWithinInterval, startOfDay } from 'date-fns'
import { cn } from '@/lib/utils'
import type { AppointmentStatus } from '@/types'
import { useTheme } from '@/context/ThemeContext'

const PASTEL_COLORS = {
  mint: '#d1fae5',
  yellow: '#fef9c3',
  lavender: '#e9d5ff',
  pink: '#fce7f3',
  blue: '#dbeafe',
  peach: '#fed7aa',
}

const STATUS_COLORS: Record<AppointmentStatus, string> = {
  requested: PASTEL_COLORS.yellow,
  confirmed: PASTEL_COLORS.blue,
  checked_in: PASTEL_COLORS.lavender,
  in_progress: PASTEL_COLORS.mint,
  completed: '#86efac',
  cancelled: PASTEL_COLORS.pink,
  no_show: PASTEL_COLORS.peach,
}

interface DateRange {
  label: string
  days: number
}

const DATE_RANGES: DateRange[] = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 14 days', days: 14 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
]

export function ReportsPage() {
  const { colors } = useTheme()
  const [dateRange, setDateRange] = useState<DateRange>(DATE_RANGES[2]) // Default to 30 days
  const { data: appointments = [] } = useAppointments()
  const { data: clients = [] } = useClients()
  const { data: services = [] } = useServices()

  const today = startOfDay(new Date())
  const startDate = subDays(today, dateRange.days)

  // Filter appointments within date range
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const aptDate = parseISO(apt.startTime)
      return isWithinInterval(aptDate, { start: startDate, end: today })
    })
  }, [appointments, startDate, today])

  // Revenue over time data
  const revenueData = useMemo(() => {
    const dailyRevenue: Record<string, number> = {}

    // Initialize all days in range
    for (let i = dateRange.days - 1; i >= 0; i--) {
      const date = format(subDays(today, i), 'MMM d')
      dailyRevenue[date] = 0
    }

    // Sum revenue by day
    filteredAppointments
      .filter((apt) => apt.status === 'completed')
      .forEach((apt) => {
        const date = format(parseISO(apt.startTime), 'MMM d')
        if (dailyRevenue[date] !== undefined) {
          dailyRevenue[date] += apt.totalAmount
        }
      })

    return Object.entries(dailyRevenue).map(([date, revenue]) => ({
      date,
      revenue,
    }))
  }, [filteredAppointments, dateRange.days, today])

  // Appointments by status data
  const statusData = useMemo(() => {
    const statusCounts: Record<AppointmentStatus, number> = {
      requested: 0,
      confirmed: 0,
      checked_in: 0,
      in_progress: 0,
      completed: 0,
      cancelled: 0,
      no_show: 0,
    }

    filteredAppointments.forEach((apt) => {
      statusCounts[apt.status]++
    })

    return Object.entries(statusCounts)
      .filter(([, count]) => count > 0)
      .map(([status, count]) => ({
        status: status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        count,
        fill: STATUS_COLORS[status as AppointmentStatus],
      }))
  }, [filteredAppointments])

  // Top services data
  const topServicesData = useMemo(() => {
    const serviceCounts: Record<string, number> = {}

    filteredAppointments.forEach((apt) => {
      apt.pets.forEach((pet) => {
        pet.services.forEach((service) => {
          const svc = services.find((s) => s.id === service.serviceId)
          const name = svc?.name || 'Unknown Service'
          serviceCounts[name] = (serviceCounts[name] || 0) + 1
        })
      })
    })

    return Object.entries(serviceCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [filteredAppointments, services])

  // Client acquisition data
  const clientAcquisitionData = useMemo(() => {
    const dailyNewClients: Record<string, number> = {}

    // Initialize all days in range
    for (let i = dateRange.days - 1; i >= 0; i--) {
      const date = format(subDays(today, i), 'MMM d')
      dailyNewClients[date] = 0
    }

    // Count new clients by day
    clients.forEach((client) => {
      const createdDate = parseISO(client.createdAt)
      if (isWithinInterval(createdDate, { start: startDate, end: today })) {
        const date = format(createdDate, 'MMM d')
        if (dailyNewClients[date] !== undefined) {
          dailyNewClients[date]++
        }
      }
    })

    return Object.entries(dailyNewClients).map(([date, count]) => ({
      date,
      clients: count,
    }))
  }, [clients, startDate, today, dateRange.days])

  // CSV Export function
  const handleExportCSV = () => {
    const headers = ['Date', 'Client', 'Pet', 'Service', 'Status', 'Amount']
    const rows: string[][] = []

    filteredAppointments.forEach((apt) => {
      const client = clients.find((c) => c.id === apt.clientId)
      const clientName = client ? `${client.firstName} ${client.lastName}` : 'Unknown'
      const date = format(parseISO(apt.startTime), 'yyyy-MM-dd HH:mm')

      apt.pets.forEach((petData) => {
        petData.services.forEach((service) => {
          const svc = services.find((s) => s.id === service.serviceId)
          rows.push([
            date,
            clientName,
            petData.petId,
            svc?.name || 'Unknown',
            apt.status,
            service.finalPrice.toFixed(2),
          ])
        })
      })
    })

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'appointments-report.csv'
    link.click()
    URL.revokeObjectURL(link.href)
  }

  // Calculate summary stats
  const totalRevenue = filteredAppointments
    .filter((apt) => apt.status === 'completed')
    .reduce((sum, apt) => sum + apt.totalAmount, 0)

  const totalAppointments = filteredAppointments.length
  const completedAppointments = filteredAppointments.filter((apt) => apt.status === 'completed').length

  return (
    <div className={cn('min-h-screen p-6', colors.pageGradient)}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1e293b]">Reports</h1>
            <p className="text-[#334155]">
              Analytics and insights for your grooming business
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range Selector */}
            <div className="flex rounded-xl border-2 border-[#1e293b] bg-white overflow-hidden shadow-[2px_2px_0px_0px_#1e293b]">
              {DATE_RANGES.map((range) => (
                <button
                  key={range.days}
                  onClick={() => setDateRange(range)}
                  className={cn(
                    'px-3 py-2 text-sm font-medium transition-colors',
                    dateRange.days === range.days
                      ? 'bg-[#d1fae5] text-[#1e293b]'
                      : 'text-[#334155] hover:bg-[#fef9c3]'
                  )}
                >
                  {range.label}
                </button>
              ))}
            </div>
            {/* Export Button */}
            <Button onClick={handleExportCSV} className="gap-2">
              <Download className="h-4 w-4" />
              Download CSV
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <div
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          style={{ animation: 'fadeInUp 0.5s ease-out forwards' }}
        >
          <Card className="border-2 border-[#1e293b] rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] bg-white">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-[#d1fae5] p-3 border-2 border-[#1e293b]">
                <TrendingUp className="h-6 w-6 text-[#1e293b]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1e293b]">${totalRevenue.toFixed(0)}</p>
                <p className="text-sm text-[#334155]">Total Revenue</p>
              </div>
            </div>
          </Card>
          <Card className="border-2 border-[#1e293b] rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] bg-white">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-[#fef9c3] p-3 border-2 border-[#1e293b]">
                <Calendar className="h-6 w-6 text-[#1e293b]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1e293b]">{totalAppointments}</p>
                <p className="text-sm text-[#334155]">Total Appointments</p>
              </div>
            </div>
          </Card>
          <Card className="border-2 border-[#1e293b] rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] bg-white">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-[#e9d5ff] p-3 border-2 border-[#1e293b]">
                <Scissors className="h-6 w-6 text-[#1e293b]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1e293b]">{completedAppointments}</p>
                <p className="text-sm text-[#334155]">Completed</p>
              </div>
            </div>
          </Card>
          <Card className="border-2 border-[#1e293b] rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] bg-white">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-[#fce7f3] p-3 border-2 border-[#1e293b]">
                <Users className="h-6 w-6 text-[#1e293b]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1e293b]">{clients.length}</p>
                <p className="text-sm text-[#334155]">Total Clients</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue Over Time */}
          <Card
            className="border-2 border-[#1e293b] rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] bg-white"
            style={{ animation: 'fadeInUp 0.5s ease-out 0.1s forwards', opacity: 0 }}
          >
            <CardTitle className="mb-4 text-[#1e293b]">Revenue Over Time</CardTitle>
            <div className="h-[300px]" style={{ outline: 'none', cursor: 'default' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueData} style={{ outline: 'none' }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '2px solid #1e293b',
                      borderRadius: '12px',
                      boxShadow: '2px 2px 0px 0px #1e293b',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#059669"
                    strokeWidth={3}
                    dot={{ fill: PASTEL_COLORS.mint, stroke: '#059669', strokeWidth: 2, r: 4 }}
                    activeDot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Appointments by Status */}
          <Card
            className="border-2 border-[#1e293b] rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] bg-white"
            style={{ animation: 'fadeInUp 0.5s ease-out 0.2s forwards', opacity: 0 }}
          >
            <CardTitle className="mb-4 text-[#1e293b]">Appointments by Status</CardTitle>
            <div className="h-[300px]" style={{ outline: 'none', cursor: 'default' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} style={{ outline: 'none' }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="status"
                    tick={{ fontSize: 11, fill: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '2px solid #1e293b',
                      borderRadius: '12px',
                      boxShadow: '2px 2px 0px 0px #1e293b',
                    }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} style={{ cursor: 'default' }}>
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} stroke="#1e293b" strokeWidth={2} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Top Services */}
          <Card
            className="border-2 border-[#1e293b] rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] bg-white"
            style={{ animation: 'fadeInUp 0.5s ease-out 0.3s forwards', opacity: 0 }}
          >
            <CardTitle className="mb-4 text-[#1e293b]">Top Services</CardTitle>
            <div className="h-[300px]" style={{ outline: 'none', cursor: 'default' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topServicesData} layout="vertical" style={{ outline: 'none' }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12, fill: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12, fill: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '2px solid #1e293b',
                      borderRadius: '12px',
                      boxShadow: '2px 2px 0px 0px #1e293b',
                    }}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]} style={{ cursor: 'default' }}>
                    {topServicesData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={Object.values(PASTEL_COLORS)[index % Object.values(PASTEL_COLORS).length]}
                        stroke="#1e293b"
                        strokeWidth={2}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Client Acquisition */}
          <Card
            className="border-2 border-[#1e293b] rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] bg-white"
            style={{ animation: 'fadeInUp 0.5s ease-out 0.4s forwards', opacity: 0 }}
          >
            <CardTitle className="mb-4 text-[#1e293b]">New Clients Over Time</CardTitle>
            <div className="h-[300px]" style={{ outline: 'none', cursor: 'default' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={clientAcquisitionData} style={{ outline: 'none' }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '2px solid #1e293b',
                      borderRadius: '12px',
                      boxShadow: '2px 2px 0px 0px #1e293b',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="clients"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    dot={{ fill: PASTEL_COLORS.lavender, stroke: '#8b5cf6', strokeWidth: 2, r: 4 }}
                    activeDot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Disable chart selection/focus highlighting */
        .recharts-wrapper,
        .recharts-wrapper svg,
        .recharts-surface,
        .recharts-layer,
        .recharts-bar-rectangle,
        .recharts-line-curve,
        .recharts-dot {
          outline: none !important;
          cursor: default !important;
        }

        .recharts-wrapper:focus,
        .recharts-wrapper svg:focus,
        .recharts-surface:focus,
        .recharts-layer:focus {
          outline: none !important;
        }

        .recharts-wrapper *:focus {
          outline: none !important;
        }
      `}</style>
    </div>
  )
}
