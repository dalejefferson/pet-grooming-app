import type { AppointmentStatus } from '@/types'

export const PASTEL_COLORS = {
  mint: '#d1fae5',
  yellow: '#fef9c3',
  lavender: '#e9d5ff',
  pink: '#fce7f3',
  blue: '#dbeafe',
  peach: '#fed7aa',
}

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  requested: PASTEL_COLORS.yellow,
  confirmed: PASTEL_COLORS.blue,
  checked_in: PASTEL_COLORS.lavender,
  in_progress: PASTEL_COLORS.mint,
  completed: '#86efac',
  cancelled: PASTEL_COLORS.pink,
  no_show: PASTEL_COLORS.peach,
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
  totalClients: number
}
