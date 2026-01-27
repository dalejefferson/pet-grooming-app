import { useState, useMemo } from 'react'
import { Download, FileText } from 'lucide-react'
import { Button } from '@/components/common'
import { useAppointments, useClients, useServices } from '@/hooks'
import { format, subDays, parseISO, isWithinInterval, startOfDay } from 'date-fns'
import { cn } from '@/lib/utils'
import type { AppointmentStatus } from '@/types'
import { useTheme } from '@/context/ThemeContext'
import { exportReportPdf } from '@/lib/utils/reportPdfExport'
import { exportReportCsv } from '@/lib/utils/reportCsvExport'
import {
  DateRangeSelector,
  ReportStatsCards,
  RevenueChart,
  AppointmentsChart,
  TopServicesChart,
  NewClientsChart,
  ReportsChartStyles,
  DATE_RANGES,
  STATUS_COLORS,
} from '@/components/reports'
import type { DateRange } from '@/components/reports'

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

  // Calculate summary stats
  const totalRevenue = filteredAppointments
    .filter((apt) => apt.status === 'completed')
    .reduce((sum, apt) => sum + apt.totalAmount, 0)

  const totalAppointments = filteredAppointments.length
  const completedAppointments = filteredAppointments.filter((apt) => apt.status === 'completed').length

  const stats = {
    totalRevenue,
    totalAppointments,
    completedAppointments,
    totalClients: clients.length,
  }

  const handleExportCSV = () => {
    exportReportCsv(filteredAppointments, clients, services)
  }

  const handleExportPDF = () => {
    exportReportPdf({
      dateRange,
      startDate,
      today,
      filteredAppointments,
      clients,
      services,
      stats,
      revenueData,
      statusData,
      topServicesData,
      clientAcquisitionData,
    })
  }

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
            <DateRangeSelector dateRange={dateRange} onDateRangeChange={setDateRange} />
            <Button onClick={handleExportPDF} className="gap-2">
              <FileText className="h-4 w-4" />
              Download PDF
            </Button>
            <Button onClick={handleExportCSV} variant="secondary" className="gap-2">
              <Download className="h-4 w-4" />
              Download CSV
            </Button>
          </div>
        </div>

        {/* Summary Stats */}
        <ReportStatsCards stats={stats} />

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <RevenueChart data={revenueData} />
          <AppointmentsChart data={statusData} />
          <TopServicesChart data={topServicesData} />
          <NewClientsChart data={clientAcquisitionData} />
        </div>
      </div>

      <ReportsChartStyles />
    </div>
  )
}
