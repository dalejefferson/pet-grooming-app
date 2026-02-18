import type { Appointment } from '../types'
import { supabase } from '@/lib/supabase/client'
import { mapAppointment } from '../types/supabase-mappers'
import { parseISO } from 'date-fns'

export interface DateRange {
  startDate: string
  endDate: string
}

export interface StaffPerformanceMetrics {
  staffId: string
  dateRange: DateRange
  appointmentsCompleted: number
  appointmentsScheduled: number
  totalRevenue: number
  averageRating: number | null
  noShowRate: number
  cancellationRate: number
  clientReturnRate: number
  averageAppointmentDuration: number
  peakHours: { hour: number; count: number }[]
  serviceBreakdown: { serviceName: string; count: number; revenue: number }[]
}

// ============================================
// Pure calculation helpers (no DB access)
// ============================================

function calculateAverageRating(): null {
  // No real rating system implemented yet
  return null
}

function calculateClientReturnRate(appointments: Appointment[]): number {
  if (appointments.length === 0) return 0

  // Get unique clients
  const clientIds = appointments.map((a) => a.clientId)
  const uniqueClients = new Set(clientIds)

  // Count clients who have more than one appointment
  const clientAppointmentCount: Record<string, number> = {}
  for (const clientId of clientIds) {
    clientAppointmentCount[clientId] = (clientAppointmentCount[clientId] || 0) + 1
  }

  const returningClients = Object.values(clientAppointmentCount).filter((count) => count > 1).length

  return uniqueClients.size > 0
    ? Number(((returningClients / uniqueClients.size) * 100).toFixed(1))
    : 0
}

function calculatePeakHours(appointments: Appointment[]): { hour: number; count: number }[] {
  const hourCounts: Record<number, number> = {}

  for (const apt of appointments) {
    const hour = parseISO(apt.startTime).getHours()
    hourCounts[hour] = (hourCounts[hour] || 0) + 1
  }

  return Object.entries(hourCounts)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5) // Top 5 peak hours
}

function calculateServiceBreakdown(
  appointments: Appointment[]
): { serviceName: string; count: number; revenue: number }[] {
  const serviceData: Record<string, { count: number; revenue: number }> = {}

  for (const apt of appointments) {
    for (const pet of apt.pets) {
      for (const service of pet.services) {
        const serviceName = service.service?.name || 'Unknown Service'
        if (!serviceData[serviceName]) {
          serviceData[serviceName] = { count: 0, revenue: 0 }
        }
        serviceData[serviceName].count += 1
        const price = Number(service.finalPrice) || 0
        serviceData[serviceName].revenue += price
      }
    }
  }

  return Object.entries(serviceData)
    .map(([serviceName, data]) => ({
      serviceName,
      count: data.count,
      revenue: Number(data.revenue.toFixed(2)),
    }))
    .sort((a, b) => b.revenue - a.revenue)
}

function calculateAverageAppointmentDuration(appointments: Appointment[]): number {
  if (appointments.length === 0) return 0

  const totalMinutes = appointments.reduce((sum, apt) => {
    const start = parseISO(apt.startTime)
    const end = parseISO(apt.endTime)
    return sum + (end.getTime() - start.getTime()) / (1000 * 60)
  }, 0)

  return Math.round(totalMinutes / appointments.length)
}

// ============================================
// Supabase query helper
// ============================================

async function fetchAppointments(filters: {
  groomerId?: string
  organizationId?: string
  startDate: string
  endDate: string
}): Promise<Appointment[]> {
  let query = supabase
    .from('appointments')
    .select('*')
    .gte('start_time', filters.startDate)
    .lte('start_time', filters.endDate)

  if (filters.groomerId) {
    query = query.eq('groomer_id', filters.groomerId)
  }

  if (filters.organizationId) {
    query = query.eq('organization_id', filters.organizationId)
  }

  const { data, error } = await query
  if (error) throw error

  // Map rows to Appointment type
  // Note: pets array is stored as JSONB or in a junction table.
  // mapAppointment expects a pets array; the DB row may include it as JSON.
  return (data ?? []).map((row: Record<string, unknown>) => {
    // If the DB stores pets as a JSONB column, it'll be available directly.
    // Otherwise mapAppointment returns empty pets array which is fine for metrics.
    const pets = (row.pets as Appointment['pets'] | undefined) ?? []
    return mapAppointment(row, pets)
  })
}

function computeMetrics(
  staffId: string,
  dateRange: DateRange,
  staffAppointments: Appointment[]
): StaffPerformanceMetrics {
  const completedAppointments = staffAppointments.filter((a) => a.status === 'completed')
  const cancelledAppointments = staffAppointments.filter((a) => a.status === 'cancelled')
  const noShowAppointments = staffAppointments.filter((a) => a.status === 'no_show')

  const totalRevenue = completedAppointments.reduce((sum, apt) => sum + apt.totalAmount, 0)
  const noShowRate =
    staffAppointments.length > 0
      ? Number(((noShowAppointments.length / staffAppointments.length) * 100).toFixed(1))
      : 0
  const cancellationRate =
    staffAppointments.length > 0
      ? Number(((cancelledAppointments.length / staffAppointments.length) * 100).toFixed(1))
      : 0

  return {
    staffId,
    dateRange,
    appointmentsCompleted: completedAppointments.length,
    appointmentsScheduled: staffAppointments.length,
    totalRevenue: Number(totalRevenue.toFixed(2)),
    averageRating: calculateAverageRating(),
    noShowRate,
    cancellationRate,
    clientReturnRate: calculateClientReturnRate(completedAppointments),
    averageAppointmentDuration: calculateAverageAppointmentDuration(completedAppointments),
    peakHours: calculatePeakHours(completedAppointments),
    serviceBreakdown: calculateServiceBreakdown(completedAppointments),
  }
}

// ============================================
// Performance API
// ============================================

export const performanceApi = {
  async getStaffPerformance(
    staffId: string,
    dateRange: DateRange
  ): Promise<StaffPerformanceMetrics> {
    const staffAppointments = await fetchAppointments({
      groomerId: staffId,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    })

    return computeMetrics(staffId, dateRange, staffAppointments)
  },

  async getTeamPerformance(
    organizationId: string,
    dateRange: DateRange
  ): Promise<{
    overall: Omit<StaffPerformanceMetrics, 'staffId'>
    byStaff: StaffPerformanceMetrics[]
  }> {
    const orgAppointments = await fetchAppointments({
      organizationId,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    })

    // Get unique staff IDs
    const staffIds = [...new Set(orgAppointments.map((a) => a.groomerId).filter(Boolean))] as string[]

    // Calculate per-staff metrics
    const byStaff = await Promise.all(
      staffIds.map((staffId) => this.getStaffPerformance(staffId, dateRange))
    )

    // Calculate overall metrics
    const completedAppointments = orgAppointments.filter((a) => a.status === 'completed')
    const cancelledAppointments = orgAppointments.filter((a) => a.status === 'cancelled')
    const noShowAppointments = orgAppointments.filter((a) => a.status === 'no_show')

    const totalRevenue = completedAppointments.reduce((sum, apt) => sum + apt.totalAmount, 0)
    const noShowRate =
      orgAppointments.length > 0
        ? Number(((noShowAppointments.length / orgAppointments.length) * 100).toFixed(1))
        : 0
    const cancellationRate =
      orgAppointments.length > 0
        ? Number(((cancelledAppointments.length / orgAppointments.length) * 100).toFixed(1))
        : 0

    return {
      overall: {
        dateRange,
        appointmentsCompleted: completedAppointments.length,
        appointmentsScheduled: orgAppointments.length,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        averageRating: null,
        noShowRate,
        cancellationRate,
        clientReturnRate: calculateClientReturnRate(completedAppointments),
        averageAppointmentDuration: calculateAverageAppointmentDuration(completedAppointments),
        peakHours: calculatePeakHours(completedAppointments),
        serviceBreakdown: calculateServiceBreakdown(completedAppointments),
      },
      byStaff,
    }
  },

  async getPerformanceComparison(
    staffIds: string[],
    dateRange: DateRange
  ): Promise<StaffPerformanceMetrics[]> {
    return Promise.all(staffIds.map((staffId) => this.getStaffPerformance(staffId, dateRange)))
  },

  async getPerformanceTrend(
    staffId: string,
    periods: DateRange[]
  ): Promise<StaffPerformanceMetrics[]> {
    return Promise.all(periods.map((period) => this.getStaffPerformance(staffId, period)))
  },
}
