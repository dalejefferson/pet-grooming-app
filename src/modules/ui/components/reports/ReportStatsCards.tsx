import { TrendingUp, Calendar, Scissors, Users, XCircle, UserX } from 'lucide-react'
import { Card } from '../common'
import type { ReportStats } from './types'
import type { ThemeColors } from '../../context/ThemeContext'

interface ReportStatsCardsProps {
  stats: ReportStats
  colors: ThemeColors
}

export function ReportStatsCards({ stats, colors }: ReportStatsCardsProps) {
  const { totalRevenue, totalAppointments, completedAppointments, cancelledAppointments, noShowAppointments, totalClients } = stats

  return (
    <div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
      style={{ animation: 'fadeInUp 0.5s ease-out forwards' }}
    >
      <Card className="border-2 border-[#1e293b] rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] bg-white">
        <div className="flex items-center gap-4">
          <div
            className="rounded-xl p-3 border-2 border-[#1e293b]"
            style={{ backgroundColor: colors.accentColor }}
          >
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
          <div
            className="rounded-xl p-3 border-2 border-[#1e293b]"
            style={{ backgroundColor: colors.secondaryAccent }}
          >
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
          <div
            className="rounded-xl p-3 border-2 border-[#1e293b]"
            style={{ backgroundColor: colors.accentColorLight }}
          >
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
          <div
            className="rounded-xl p-3 border-2 border-[#1e293b]"
            style={{ backgroundColor: colors.accentColorDark }}
          >
            <Users className="h-6 w-6 text-[#1e293b]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#1e293b]">{totalClients}</p>
            <p className="text-sm text-[#334155]">Total Clients</p>
          </div>
        </div>
      </Card>
      <Card className="border-2 border-[#1e293b] rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] bg-white">
        <div className="flex items-center gap-4">
          <div
            className="rounded-xl p-3 border-2 border-[#1e293b]"
            style={{ backgroundColor: '#e5e7eb' }}
          >
            <XCircle className="h-6 w-6 text-[#374151]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#1e293b]">{cancelledAppointments}</p>
            <p className="text-sm text-[#334155]">Cancelled</p>
          </div>
        </div>
      </Card>
      <Card className="border-2 border-[#1e293b] rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] bg-white">
        <div className="flex items-center gap-4">
          <div
            className="rounded-xl p-3 border-2 border-[#1e293b]"
            style={{ backgroundColor: '#fce7f3' }}
          >
            <UserX className="h-6 w-6 text-[#9d174d]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[#1e293b]">{noShowAppointments}</p>
            <p className="text-sm text-[#334155]">No Shows</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
