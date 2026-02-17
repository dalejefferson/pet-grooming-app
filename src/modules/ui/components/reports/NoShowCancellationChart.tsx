import { memo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card, CardTitle } from '../common'
import type { NoShowCancellationData } from './types'
import type { ThemeColors } from '../../context/ThemeContext'

const TOOLTIP_CONTENT_STYLE = {
  backgroundColor: 'white',
  border: '2px solid #1e293b',
  borderRadius: '12px',
  boxShadow: '2px 2px 0px 0px #1e293b',
} as const

const CARD_ANIMATION_STYLE = { animation: 'fadeInUp 0.5s ease-out 0.6s forwards', opacity: 0 } as const

interface NoShowCancellationChartProps {
  data: NoShowCancellationData
  colors: ThemeColors
}

export const NoShowCancellationChart = memo(function NoShowCancellationChart({ data, colors }: NoShowCancellationChartProps) {
  const { noShowCount, cancelledCount, completedCount, totalAppointments, estimatedLostRevenue } = data

  // Calculate rates
  const noShowRate = totalAppointments > 0 ? (noShowCount / totalAppointments) * 100 : 0
  const cancellationRate = totalAppointments > 0 ? (cancelledCount / totalAppointments) * 100 : 0

  // Prepare chart data
  const chartData = [
    { name: 'Completed', count: completedCount, color: colors.accentColorDark },
    { name: 'Cancelled', count: cancelledCount, color: colors.secondaryAccent },
    { name: 'No-Shows', count: noShowCount, color: colors.gradientTo },
  ]

  return (
    <Card
      className="border-2 border-[#1e293b] rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] bg-white"
      style={CARD_ANIMATION_STYLE}
    >
      <CardTitle className="mb-4 text-[#1e293b]">No-Shows & Cancellations</CardTitle>

      {/* Stat boxes */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div
          className="rounded-xl border-2 border-[#1e293b] p-3 text-center shadow-[2px_2px_0px_0px_#1e293b]"
          style={{ backgroundColor: colors.gradientTo }}
        >
          <p className="text-xs font-medium text-[#64748b] mb-1">No-Show Rate</p>
          <p className="text-lg font-bold text-[#1e293b]">{noShowRate.toFixed(1)}%</p>
        </div>
        <div
          className="rounded-xl border-2 border-[#1e293b] p-3 text-center shadow-[2px_2px_0px_0px_#1e293b]"
          style={{ backgroundColor: colors.secondaryAccent }}
        >
          <p className="text-xs font-medium text-[#64748b] mb-1">Cancellation Rate</p>
          <p className="text-lg font-bold text-[#1e293b]">{cancellationRate.toFixed(1)}%</p>
        </div>
        <div
          className="rounded-xl border-2 border-[#1e293b] p-3 text-center shadow-[2px_2px_0px_0px_#1e293b]"
          style={{ backgroundColor: colors.accentColorLight }}
        >
          <p className="text-xs font-medium text-[#64748b] mb-1">Lost Revenue</p>
          <p className="text-lg font-bold text-[#1e293b]">${estimatedLostRevenue.toFixed(0)}</p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="h-[300px]" style={{ outline: 'none', cursor: 'default' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" style={{ outline: 'none' }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: '#334155' }}
              tickLine={{ stroke: '#334155' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 12, fill: '#334155' }}
              tickLine={{ stroke: '#334155' }}
              width={80}
            />
            <Tooltip
              contentStyle={TOOLTIP_CONTENT_STYLE}
              formatter={(value) => [Number(value) || 0, 'Count']}
            />
            <Bar dataKey="count" radius={[0, 8, 8, 0]} style={{ cursor: 'default' }}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke="#1e293b"
                  strokeWidth={2}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
})
