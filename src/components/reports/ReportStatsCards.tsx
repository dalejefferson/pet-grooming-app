import { TrendingUp, Calendar, Scissors, Users } from 'lucide-react'
import { Card } from '@/components/common'
import type { ReportStats } from './types'

interface ReportStatsCardsProps {
  stats: ReportStats
}

export function ReportStatsCards({ stats }: ReportStatsCardsProps) {
  const { totalRevenue, totalAppointments, completedAppointments, totalClients } = stats

  return (
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
            <p className="text-2xl font-bold text-[#1e293b]">{totalClients}</p>
            <p className="text-sm text-[#334155]">Total Clients</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
