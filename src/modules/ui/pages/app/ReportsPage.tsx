import { useState, useMemo, useCallback, useEffect } from 'react'
import { Download, FileText, BarChart3 } from 'lucide-react'
import { Button, EmptyState, SubscriptionGate, LoadingSpinner } from '../../components/common'
import { useToast } from '@/modules/ui/hooks/useToast'
import { useAppointments, useClients, useServices, useGroomers, usePets } from '@/hooks'
import { format, subDays, parseISO, isWithinInterval, startOfDay, getDay, getHours } from 'date-fns'
import { cn } from '@/lib/utils'
import type { AppointmentStatus } from '@/types'
import { useTheme, useKeyboardShortcuts } from '../../context'
import { exportReportPdf } from '@/lib/utils/reportPdfExport'
import { exportReportCsv } from '@/lib/utils/reportCsvExport'
import {
  DateRangeSelector,
  ReportStatsCards,
  RevenueChart,
  AppointmentsChart,
  TopServicesChart,
  NewClientsChart,
  GroomerPerformanceChart,
  ClientRetentionChart,
  NoShowCancellationChart,
  PeakHoursChart,
  ServiceCategoryRevenueChart,
  ReportsChartStyles,
  DATE_RANGES,
  getThemedStatusColors,
} from '../../components/reports'
import type { DateRange } from '../../components/reports'

export function ReportsPage() {
  const { colors } = useTheme()
  const { showSuccess, showError } = useToast()
  const { registerReportCycle } = useKeyboardShortcuts()
  const [dateRange, setDateRange] = useState<DateRange>(DATE_RANGES[2]) // Default to 30 days
  const { data: appointments = [], isLoading: isLoadingAppointments } = useAppointments()
  const { data: clients = [], isLoading: isLoadingClients } = useClients()
  const { data: services = [], isLoading: isLoadingServices } = useServices()
  const { data: groomers = [] } = useGroomers()
  const { data: pets = [] } = usePets()

  const isLoading = isLoadingAppointments || isLoadingClients || isLoadingServices

  // Cycle through date ranges: 7 -> 14 -> 30 -> 90 -> 7
  const cycleReportRange = useCallback(() => {
    setDateRange(current => {
      const currentIndex = DATE_RANGES.findIndex(r => r.days === current.days)
      return DATE_RANGES[(currentIndex + 1) % DATE_RANGES.length]
    })
  }, [])

  useEffect(() => {
    registerReportCycle(cycleReportRange)
  }, [registerReportCycle, cycleReportRange])

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

  // Appointments by status data (uses theme colors)
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

    const themedStatusColors = getThemedStatusColors(colors)

    return Object.entries(statusCounts)
      .filter(([, count]) => count > 0)
      .map(([status, count]) => ({
        status: status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        count,
        fill: themedStatusColors[status as AppointmentStatus],
      }))
  }, [filteredAppointments, colors])

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

  // Groomer performance data
  const groomerPerformanceData = useMemo(() => {
    const groomerStats: Record<string, { revenue: number; appointments: number }> = {}

    filteredAppointments
      .filter((apt) => apt.status === 'completed' && apt.groomerId)
      .forEach((apt) => {
        const groomerId = apt.groomerId!
        if (!groomerStats[groomerId]) {
          groomerStats[groomerId] = { revenue: 0, appointments: 0 }
        }
        groomerStats[groomerId].revenue += apt.totalAmount
        groomerStats[groomerId].appointments += 1
      })

    return Object.entries(groomerStats)
      .map(([groomerId, stats]) => {
        const groomer = groomers.find((g) => g.id === groomerId)
        return {
          name: groomer ? `${groomer.firstName} ${groomer.lastName}` : 'Unknown',
          revenue: stats.revenue,
          appointments: stats.appointments,
        }
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
  }, [filteredAppointments, groomers])

  // Client retention data
  const clientRetentionData = useMemo(() => {
    const clientAppointmentCounts: Record<string, number> = {}

    appointments.forEach((apt) => {
      clientAppointmentCounts[apt.clientId] = (clientAppointmentCounts[apt.clientId] || 0) + 1
    })

    const repeatClients = Object.values(clientAppointmentCounts).filter((count) => count >= 2).length
    const newClients = Object.values(clientAppointmentCounts).filter((count) => count === 1).length

    return [
      { name: 'New Clients', value: newClients },
      { name: 'Repeat Clients', value: repeatClients },
    ]
  }, [appointments])

  // No-show and cancellation data
  const noShowCancellationData = useMemo(() => {
    const noShowCount = filteredAppointments.filter((apt) => apt.status === 'no_show').length
    const cancelledCount = filteredAppointments.filter((apt) => apt.status === 'cancelled').length
    const completedCount = filteredAppointments.filter((apt) => apt.status === 'completed').length
    const totalAppointments = filteredAppointments.length

    // Estimate lost revenue based on average completed appointment value
    const avgRevenue = completedCount > 0
      ? filteredAppointments
          .filter((apt) => apt.status === 'completed')
          .reduce((sum, apt) => sum + apt.totalAmount, 0) / completedCount
      : 0
    const estimatedLostRevenue = (noShowCount + cancelledCount) * avgRevenue

    return {
      noShowCount,
      cancelledCount,
      completedCount,
      totalAppointments,
      estimatedLostRevenue,
    }
  }, [filteredAppointments])

  // Peak hours heatmap data
  const peakHoursData = useMemo(() => {
    const grid: Record<string, number> = {}
    let maxCount = 0

    // Initialize grid (0-6 for days, 8-18 for hours)
    for (let day = 0; day < 7; day++) {
      for (let hour = 8; hour <= 18; hour++) {
        grid[`${day}-${hour}`] = 0
      }
    }

    filteredAppointments.forEach((apt) => {
      const aptDate = parseISO(apt.startTime)
      const day = getDay(aptDate) // 0 = Sunday, 6 = Saturday
      const hour = getHours(aptDate)
      if (hour >= 8 && hour <= 18) {
        const key = `${day}-${hour}`
        grid[key] = (grid[key] || 0) + 1
        maxCount = Math.max(maxCount, grid[key])
      }
    })

    return { grid, maxCount }
  }, [filteredAppointments])

  // Service category revenue data
  const serviceCategoryRevenueData = useMemo(() => {
    const categoryRevenue: Record<string, number> = {
      Bath: 0,
      Haircut: 0,
      Nail: 0,
      Specialty: 0,
      Package: 0,
    }

    filteredAppointments
      .filter((apt) => apt.status === 'completed')
      .forEach((apt) => {
        apt.pets.forEach((pet) => {
          pet.services.forEach((svc) => {
            const service = services.find((s) => s.id === svc.serviceId)
            if (service) {
              const category = service.category.charAt(0).toUpperCase() + service.category.slice(1)
              if (categoryRevenue[category] !== undefined) {
                categoryRevenue[category] += svc.finalPrice
              }
            }
          })
        })
      })

    return Object.entries(categoryRevenue)
      .filter(([, revenue]) => revenue > 0)
      .map(([category, revenue]) => ({ category, revenue }))
  }, [filteredAppointments, services])

  // Calculate summary stats
  const totalRevenue = filteredAppointments
    .filter((apt) => apt.status === 'completed')
    .reduce((sum, apt) => sum + apt.totalAmount, 0)

  const totalAppointments = filteredAppointments.length
  const completedAppointments = filteredAppointments.filter((apt) => apt.status === 'completed').length
  const cancelledAppointments = filteredAppointments.filter((apt) => apt.status === 'cancelled').length
  const noShowAppointments = filteredAppointments.filter((apt) => apt.status === 'no_show').length

  const stats = {
    totalRevenue,
    totalAppointments,
    completedAppointments,
    cancelledAppointments,
    noShowAppointments,
    totalClients: clients.length,
  }

  const handleExportCSV = () => {
    try {
      exportReportCsv(filteredAppointments, clients, services, pets, groomers)
      showSuccess('CSV report exported successfully')
    } catch {
      showError('Failed to export CSV report. Please try again.')
    }
  }

  const handleExportPDF = () => {
    try {
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
        groomerPerformanceData,
        clientRetentionData,
        noShowCancellationData,
        peakHoursData,
        serviceCategoryRevenueData,
        themeColors: colors,
      })
      showSuccess('PDF report exported successfully')
    } catch {
      showError('Failed to export PDF report. Please try again.')
    }
  }

  return (
    <div className={cn('min-h-screen p-4 lg:p-6', colors.pageGradient)}>
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
            <DateRangeSelector dateRange={dateRange} onDateRangeChange={setDateRange} colors={colors} />
            <SubscriptionGate feature="advancedReports">
              <Button
                onClick={handleExportPDF}
                className="gap-2 hover:opacity-90"
                style={{ backgroundColor: colors.accentColorDark, color: colors.textOnAccent }}
              >
                <FileText className="h-4 w-4" />
                Download PDF
              </Button>
              <Button
                onClick={handleExportCSV}
                variant="secondary"
                className="gap-2"
                style={{ backgroundColor: colors.secondaryAccent }}
              >
                <Download className="h-4 w-4" />
                Download CSV
              </Button>
            </SubscriptionGate>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <ReportStatsCards stats={stats} colors={colors} />

            {/* Charts Grid */}
            {filteredAppointments.length === 0 ? (
              <EmptyState
                icon={<BarChart3 className="h-8 w-8" />}
                title="No data for this period"
                description={`No appointments found in the last ${dateRange.days} days. Try selecting a different date range.`}
              />
            ) : (
              <div className="grid gap-6 lg:grid-cols-2">
                <RevenueChart data={revenueData} colors={colors} />
                <AppointmentsChart data={statusData} />
                <TopServicesChart data={topServicesData} colors={colors} />
                <NewClientsChart data={clientAcquisitionData} colors={colors} />
                <GroomerPerformanceChart data={groomerPerformanceData} colors={colors} />
                <ClientRetentionChart data={clientRetentionData} colors={colors} />
                <NoShowCancellationChart data={noShowCancellationData} colors={colors} />
                <PeakHoursChart data={peakHoursData} colors={colors} />
                <ServiceCategoryRevenueChart data={serviceCategoryRevenueData} colors={colors} />
              </div>
            )}
          </>
        )}
      </div>
      <ReportsChartStyles />
    </div>
  )
}
