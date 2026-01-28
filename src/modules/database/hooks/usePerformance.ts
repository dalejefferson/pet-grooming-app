import { useQuery } from '@tanstack/react-query'
import { performanceApi, type DateRange, type StaffPerformanceMetrics } from '../api/performanceApi'
import { useOrganization } from './useOrganization'
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns'

// ============================================
// Staff Performance Hooks
// ============================================

export function useStaffPerformance(staffId: string, dateRange: DateRange) {
  return useQuery({
    queryKey: ['staffPerformance', staffId, dateRange.startDate, dateRange.endDate],
    queryFn: () => performanceApi.getStaffPerformance(staffId, dateRange),
    enabled: !!staffId && !!dateRange.startDate && !!dateRange.endDate,
  })
}

export function useTeamPerformance(dateRange: DateRange) {
  const { data: organization } = useOrganization()
  const organizationId = organization?.id

  return useQuery({
    queryKey: ['teamPerformance', organizationId, dateRange.startDate, dateRange.endDate],
    queryFn: () => performanceApi.getTeamPerformance(organizationId!, dateRange),
    enabled: !!organizationId && !!dateRange.startDate && !!dateRange.endDate,
  })
}

export function usePerformanceComparison(staffIds: string[], dateRange: DateRange) {
  return useQuery({
    queryKey: ['performanceComparison', staffIds, dateRange.startDate, dateRange.endDate],
    queryFn: () => performanceApi.getPerformanceComparison(staffIds, dateRange),
    enabled: staffIds.length > 0 && !!dateRange.startDate && !!dateRange.endDate,
  })
}

export function usePerformanceTrend(staffId: string, periods: DateRange[]) {
  return useQuery({
    queryKey: ['performanceTrend', staffId, periods],
    queryFn: () => performanceApi.getPerformanceTrend(staffId, periods),
    enabled: !!staffId && periods.length > 0,
  })
}

// ============================================
// Convenience Hooks with Preset Date Ranges
// ============================================

export function useStaffPerformanceToday(staffId: string) {
  const today = new Date()
  const dateRange: DateRange = {
    startDate: format(today, 'yyyy-MM-dd'),
    endDate: format(today, 'yyyy-MM-dd'),
  }

  return useStaffPerformance(staffId, dateRange)
}

export function useStaffPerformanceThisWeek(staffId: string) {
  const today = new Date()
  const dateRange: DateRange = {
    startDate: format(startOfWeek(today, { weekStartsOn: 0 }), 'yyyy-MM-dd'),
    endDate: format(endOfWeek(today, { weekStartsOn: 0 }), 'yyyy-MM-dd'),
  }

  return useStaffPerformance(staffId, dateRange)
}

export function useStaffPerformanceThisMonth(staffId: string) {
  const today = new Date()
  const dateRange: DateRange = {
    startDate: format(startOfMonth(today), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(today), 'yyyy-MM-dd'),
  }

  return useStaffPerformance(staffId, dateRange)
}

export function useStaffPerformanceLast30Days(staffId: string) {
  const today = new Date()
  const dateRange: DateRange = {
    startDate: format(subDays(today, 30), 'yyyy-MM-dd'),
    endDate: format(today, 'yyyy-MM-dd'),
  }

  return useStaffPerformance(staffId, dateRange)
}

export function useStaffPerformanceLast90Days(staffId: string) {
  const today = new Date()
  const dateRange: DateRange = {
    startDate: format(subDays(today, 90), 'yyyy-MM-dd'),
    endDate: format(today, 'yyyy-MM-dd'),
  }

  return useStaffPerformance(staffId, dateRange)
}

export function useTeamPerformanceThisMonth() {
  const today = new Date()
  const dateRange: DateRange = {
    startDate: format(startOfMonth(today), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(today), 'yyyy-MM-dd'),
  }

  return useTeamPerformance(dateRange)
}

export function useTeamPerformanceLast30Days() {
  const today = new Date()
  const dateRange: DateRange = {
    startDate: format(subDays(today, 30), 'yyyy-MM-dd'),
    endDate: format(today, 'yyyy-MM-dd'),
  }

  return useTeamPerformance(dateRange)
}

// ============================================
// Monthly Trend Hook (Last 6 Months)
// ============================================

export function useStaffMonthlyTrend(staffId: string, monthsBack: number = 6) {
  const today = new Date()
  const periods: DateRange[] = []

  for (let i = monthsBack - 1; i >= 0; i--) {
    const monthDate = subMonths(today, i)
    periods.push({
      startDate: format(startOfMonth(monthDate), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(monthDate), 'yyyy-MM-dd'),
    })
  }

  return usePerformanceTrend(staffId, periods)
}

// ============================================
// Re-export types for convenience
// ============================================

export type { DateRange, StaffPerformanceMetrics }
