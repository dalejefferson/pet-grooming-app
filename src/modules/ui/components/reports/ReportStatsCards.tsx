import { memo } from 'react'
import { TrendingUp, Calendar, Scissors, Users, XCircle, UserX } from 'lucide-react'
import { Card } from '../common'
import type { ReportStats } from './types'
import type { ThemeColors } from '../../context/ThemeContext'

interface ReportStatsCardsProps {
  stats: ReportStats
  colors: ThemeColors
}

interface StatCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  bgStyle: React.CSSProperties | undefined
  bgClass?: string
}

function StatCard({ label, value, icon, bgStyle, bgClass }: StatCardProps) {
  return (
    <Card className="group relative border-2 border-[#1e293b] rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] bg-white">
      <div className="flex items-center gap-3">
        <div
          className={`shrink-0 rounded-xl p-3 border-2 border-[#1e293b] ${bgClass ?? ''}`}
          style={bgStyle}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-2xl font-bold text-[#1e293b]">{value}</p>
          <p className="truncate text-sm text-[#334155]">{label}</p>
        </div>
      </div>
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-10 z-50 whitespace-nowrap rounded-lg border-2 border-[#1e293b] bg-white px-3 py-1.5 text-sm font-semibold text-[#1e293b] shadow-[2px_2px_0px_0px_#1e293b] opacity-0 transition-opacity group-hover:opacity-100">
        {label}
      </div>
    </Card>
  )
}

export const ReportStatsCards = memo(function ReportStatsCards({ stats }: ReportStatsCardsProps) {
  const { totalRevenue, totalAppointments, completedAppointments, cancelledAppointments, noShowAppointments, totalClients } = stats

  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
      style={{ animation: 'fadeInUp 0.5s ease-out forwards' }}
    >
      <StatCard
        label="Total Revenue"
        value={`$${totalRevenue.toFixed(0)}`}
        icon={<TrendingUp className="h-6 w-6" style={{ color: 'var(--text-on-primary)' }} />}
        bgStyle={{ backgroundColor: 'var(--accent-color)' }}
      />
      <StatCard
        label="Total Appointments"
        value={totalAppointments}
        icon={<Calendar className="h-6 w-6" style={{ color: 'var(--text-on-secondary)' }} />}
        bgStyle={{ backgroundColor: 'var(--secondary-accent)' }}
      />
      <StatCard
        label="Completed"
        value={completedAppointments}
        icon={<Scissors className="h-6 w-6" style={{ color: 'var(--text-on-accent-light)' }} />}
        bgStyle={{ backgroundColor: 'var(--accent-color-light)' }}
      />
      <StatCard
        label="Total Clients"
        value={totalClients}
        icon={<Users className="h-6 w-6" style={{ color: 'var(--text-on-accent)' }} />}
        bgStyle={{ backgroundColor: 'var(--accent-color-dark)' }}
      />
      <StatCard
        label="Cancelled"
        value={cancelledAppointments}
        icon={<XCircle className="h-6 w-6 text-[#374151]" />}
        bgStyle={{ backgroundColor: '#e5e7eb' }}
      />
      <StatCard
        label="No Shows"
        value={noShowAppointments}
        icon={<UserX className="h-6 w-6 text-[#9d174d]" />}
        bgStyle={{ backgroundColor: '#fce7f3' }}
      />
    </div>
  )
})
