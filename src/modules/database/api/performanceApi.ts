import type { Appointment } from '../types'
import { getFromStorage, delay } from '../storage/localStorage'
import { parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns'
import { seedAppointments } from '../seed/seed'

const APPOINTMENTS_STORAGE_KEY = 'appointments'

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
  averageRating: number
  noShowRate: number
  cancellationRate: number
  clientReturnRate: number
  averageAppointmentDuration: number
  peakHours: { hour: number; count: number }[]
  serviceBreakdown: { serviceName: string; count: number; revenue: number }[]
}

function getAppointments(): Appointment[] {
  return getFromStorage<Appointment[]>(APPOINTMENTS_STORAGE_KEY, seedAppointments)
}

function calculateAverageRating(): number {
  // Mock rating between 4.5 and 5.0
  return Number((4.5 + Math.random() * 0.5).toFixed(2))
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
        serviceData[serviceName].revenue += service.finalPrice
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

export const performanceApi = {
  async getStaffPerformance(
    staffId: string,
    dateRange: DateRange
  ): Promise<StaffPerformanceMetrics> {
    await delay()

    const allAppointments = getAppointments()

    // Filter appointments for this staff member within date range
    const startDate = startOfDay(parseISO(dateRange.startDate))
    const endDate = endOfDay(parseISO(dateRange.endDate))

    const staffAppointments = allAppointments.filter((apt) => {
      if (apt.groomerId !== staffId) return false
      const aptDate = parseISO(apt.startTime)
      return isWithinInterval(aptDate, { start: startDate, end: endDate })
    })

    // Calculate metrics
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
  },

  async getTeamPerformance(
    organizationId: string,
    dateRange: DateRange
  ): Promise<{
    overall: Omit<StaffPerformanceMetrics, 'staffId'>
    byStaff: StaffPerformanceMetrics[]
  }> {
    await delay()

    const allAppointments = getAppointments()

    // Filter appointments for this organization within date range
    const startDate = startOfDay(parseISO(dateRange.startDate))
    const endDate = endOfDay(parseISO(dateRange.endDate))

    const orgAppointments = allAppointments.filter((apt) => {
      if (apt.organizationId !== organizationId) return false
      const aptDate = parseISO(apt.startTime)
      return isWithinInterval(aptDate, { start: startDate, end: endDate })
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
        averageRating:
          byStaff.length > 0
            ? Number((byStaff.reduce((sum, s) => sum + s.averageRating, 0) / byStaff.length).toFixed(2))
            : 0,
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
    await delay()

    return Promise.all(staffIds.map((staffId) => this.getStaffPerformance(staffId, dateRange)))
  },

  async getPerformanceTrend(
    staffId: string,
    periods: DateRange[]
  ): Promise<StaffPerformanceMetrics[]> {
    await delay()

    return Promise.all(periods.map((period) => this.getStaffPerformance(staffId, period)))
  },
}
