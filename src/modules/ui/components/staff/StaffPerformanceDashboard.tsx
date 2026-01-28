import { Calendar, DollarSign, Star, Users, AlertTriangle, Clock } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardDescription } from '../common/Card'
import { LoadingSpinner } from '../common/LoadingSpinner'
import { useStaffPerformanceLast30Days } from '@/modules/database/hooks'

export interface StaffPerformanceDashboardProps {
  staffId: string
}

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: 'mint' | 'lemon' | 'lavender' | 'peach' | 'pink' | 'lime'
  subtitle?: string
}

const COLOR_MAP = {
  mint: { bg: 'bg-[#d1fae5]', text: 'text-[#166534]' },
  lemon: { bg: 'bg-[#fef9c3]', text: 'text-[#a16207]' },
  lavender: { bg: 'bg-[#e9d5ff]', text: 'text-[#7c3aed]' },
  peach: { bg: 'bg-[#fed7aa]', text: 'text-[#c2410c]' },
  pink: { bg: 'bg-[#fce7f3]', text: 'text-[#be185d]' },
  lime: { bg: 'bg-[#ecfccb]', text: 'text-[#4d7c0f]' },
}

const CHART_COLORS = ['#6F8F72', '#F2A65A', '#e9d5ff', '#fed7aa', '#fce7f3', '#d1fae5']

function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  const colors = COLOR_MAP[color]

  return (
    <Card padding="md" className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-[#64748b]">{title}</p>
          <p className="mt-1 text-2xl font-bold text-[#1e293b]">{value}</p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-[#94a3b8]">{subtitle}</p>
          )}
        </div>
        <div
          className={`rounded-xl border-2 border-[#1e293b] p-2.5 shadow-[2px_2px_0px_0px_#1e293b] ${colors.bg}`}
        >
          <div className={colors.text}>{icon}</div>
        </div>
      </div>
    </Card>
  )
}

function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating - fullStars >= 0.5

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-5 w-5 ${
            i < fullStars
              ? 'fill-[#fbbf24] text-[#fbbf24]'
              : i === fullStars && hasHalfStar
                ? 'fill-[#fbbf24]/50 text-[#fbbf24]'
                : 'text-[#d1d5db]'
          }`}
        />
      ))}
      <span className="ml-1.5 text-lg font-bold text-[#1e293b]">
        {rating.toFixed(1)}
      </span>
    </div>
  )
}

export function StaffPerformanceDashboard({
  staffId,
}: StaffPerformanceDashboardProps) {
  const { data: performance, isLoading, error } = useStaffPerformanceLast30Days(staffId)

  if (isLoading) {
    return (
      <Card padding="lg">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </Card>
    )
  }

  if (error || !performance) {
    return (
      <Card padding="lg" colorVariant="pink">
        <div className="py-8 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-[#be123c]" />
          <p className="mt-2 font-medium text-[#be123c]">
            Failed to load performance data
          </p>
        </div>
      </Card>
    )
  }

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card padding="md" colorVariant="lavender">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#1e293b]">
              Performance Overview
            </h2>
            <p className="text-sm text-[#64748b]">Last 30 days</p>
          </div>
          <StarRating rating={performance.averageRating} />
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Appointments Completed"
          value={performance.appointmentsCompleted}
          subtitle={`${performance.appointmentsScheduled} scheduled`}
          icon={<Calendar className="h-5 w-5" />}
          color="mint"
        />

        <StatCard
          title="Total Revenue"
          value={formatCurrency(performance.totalRevenue)}
          icon={<DollarSign className="h-5 w-5" />}
          color="lemon"
        />

        <StatCard
          title="Avg. Duration"
          value={`${performance.averageAppointmentDuration} min`}
          icon={<Clock className="h-5 w-5" />}
          color="lavender"
        />

        <StatCard
          title="No-Show Rate"
          value={`${performance.noShowRate}%`}
          icon={<AlertTriangle className="h-5 w-5" />}
          color={performance.noShowRate > 10 ? 'pink' : 'mint'}
        />

        <StatCard
          title="Cancellation Rate"
          value={`${performance.cancellationRate}%`}
          icon={<Calendar className="h-5 w-5" />}
          color={performance.cancellationRate > 15 ? 'peach' : 'lime'}
        />

        <StatCard
          title="Client Return Rate"
          value={`${performance.clientReturnRate}%`}
          icon={<Users className="h-5 w-5" />}
          color="lavender"
        />
      </div>

      {/* Service Breakdown Chart */}
      {performance.serviceBreakdown.length > 0 && (
        <Card padding="lg">
          <CardHeader>
            <CardTitle>Service Breakdown</CardTitle>
            <CardDescription>
              Revenue by service type over the last 30 days
            </CardDescription>
          </CardHeader>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={performance.serviceBreakdown.slice(0, 6)}
                layout="vertical"
                margin={{ top: 5, right: 20, bottom: 5, left: 100 }}
              >
                <XAxis type="number" tickFormatter={(v) => `$${v}`} />
                <YAxis
                  type="category"
                  dataKey="serviceName"
                  tick={{ fontSize: 12 }}
                  width={100}
                />
                <Tooltip
                  formatter={(value) => [`$${value}`, 'Revenue']}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '2px solid #1e293b',
                    boxShadow: '3px 3px 0px 0px #1e293b',
                  }}
                />
                <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                  {performance.serviceBreakdown.slice(0, 6).map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Service count details */}
          <div className="mt-4 flex flex-wrap gap-2">
            {performance.serviceBreakdown.slice(0, 6).map((service, index) => (
              <div
                key={service.serviceName}
                className="flex items-center gap-2 rounded-lg border-2 border-[#1e293b] bg-white px-2 py-1 text-xs shadow-[2px_2px_0px_0px_#1e293b]"
              >
                <div
                  className="h-3 w-3 rounded"
                  style={{
                    backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                  }}
                />
                <span className="font-medium">{service.serviceName}</span>
                <span className="text-[#64748b]">({service.count})</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Peak Hours */}
      {performance.peakHours.length > 0 && (
        <Card padding="md">
          <CardHeader>
            <CardTitle>Peak Hours</CardTitle>
          </CardHeader>
          <div className="flex flex-wrap gap-2">
            {performance.peakHours.map((peak) => {
              const hour = peak.hour
              const ampm = hour >= 12 ? 'PM' : 'AM'
              const displayHour = hour % 12 || 12
              return (
                <div
                  key={peak.hour}
                  className="rounded-xl border-2 border-[#1e293b] bg-[#fef9c3] px-3 py-2 shadow-[2px_2px_0px_0px_#1e293b]"
                >
                  <div className="text-sm font-bold text-[#1e293b]">
                    {displayHour}:00 {ampm}
                  </div>
                  <div className="text-xs text-[#64748b]">
                    {peak.count} appt{peak.count !== 1 ? 's' : ''}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
