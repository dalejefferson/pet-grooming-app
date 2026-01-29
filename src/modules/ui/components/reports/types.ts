import type { AppointmentStatus } from '@/types'
import type { ThemeColors } from '@/modules/ui/context/ThemeContext'

export const PASTEL_COLORS = {
  mint: '#d1fae5',
  yellow: '#fef9c3',
  lavender: '#e9d5ff',
  pink: '#fce7f3',
  blue: '#dbeafe',
  peach: '#fed7aa',
}

// Default static colors (fallback)
export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  requested: PASTEL_COLORS.yellow,
  confirmed: PASTEL_COLORS.blue,
  checked_in: PASTEL_COLORS.lavender,
  in_progress: PASTEL_COLORS.mint,
  completed: '#86efac',
  cancelled: PASTEL_COLORS.pink,
  no_show: PASTEL_COLORS.peach,
}

/**
 * Generates status colors based on the current theme palette.
 * Maps each appointment status to a theme color for consistent branding.
 */
export function getThemedStatusColors(colors: ThemeColors): Record<AppointmentStatus, string> {
  return {
    completed: colors.accentColorDark,    // Primary success color
    in_progress: colors.accentColor,      // Main accent
    checked_in: colors.gradientVia,       // Mid gradient
    confirmed: colors.gradientFrom,       // Light gradient start
    requested: colors.secondaryAccent,    // Secondary accent
    cancelled: colors.accentColorLight,   // Lightest accent
    no_show: colors.gradientTo,           // Gradient end
  }
}

export interface DateRange {
  label: string
  days: number
}

export const DATE_RANGES: DateRange[] = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 14 days', days: 14 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
]

export interface RevenueDataPoint {
  date: string
  revenue: number
}

export interface StatusDataPoint {
  status: string
  count: number
  fill: string
}

export interface TopServiceDataPoint {
  name: string
  count: number
}

export interface ClientAcquisitionDataPoint {
  date: string
  clients: number
}

export interface ReportStats {
  totalRevenue: number
  totalAppointments: number
  completedAppointments: number
  cancelledAppointments: number
  noShowAppointments: number
  totalClients: number
}

export interface GroomerPerformanceDataPoint {
  name: string
  revenue: number
  appointments: number
}

export interface ServiceCategoryDataPoint {
  category: string  // "Bath", "Haircut", "Nail", "Specialty", "Package"
  revenue: number
}

export interface ClientRetentionDataPoint {
  name: string  // "New Clients" or "Repeat Clients"
  value: number
}

export interface NoShowCancellationData {
  noShowCount: number
  cancelledCount: number
  completedCount: number
  totalAppointments: number
  estimatedLostRevenue: number
}

export interface PeakHoursData {
  // 7 days x hours grid - key is "day-hour" like "0-9" for Sunday 9am
  grid: Record<string, number>
  maxCount: number
}
