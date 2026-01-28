import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardTitle } from '../common'
import type { RevenueDataPoint } from './types'
import type { ThemeColors } from '../../context/ThemeContext'

interface RevenueChartProps {
  data: RevenueDataPoint[]
  colors: ThemeColors
}

export function RevenueChart({ data, colors }: RevenueChartProps) {
  return (
    <Card
      className="border-2 border-[#1e293b] rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] bg-white"
      style={{ animation: 'fadeInUp 0.5s ease-out 0.1s forwards', opacity: 0 }}
    >
      <CardTitle className="mb-4 text-[#1e293b]">Revenue Over Time</CardTitle>
      <div className="h-[300px]" style={{ outline: 'none', cursor: 'default' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} style={{ outline: 'none' }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#334155' }}
              tickLine={{ stroke: '#334155' }}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#334155' }}
              tickLine={{ stroke: '#334155' }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Revenue']}
              contentStyle={{
                backgroundColor: 'white',
                border: '2px solid #1e293b',
                borderRadius: '12px',
                boxShadow: '2px 2px 0px 0px #1e293b',
              }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke={colors.accentColorDark}
              strokeWidth={3}
              dot={{ fill: colors.accentColor, stroke: colors.accentColorDark, strokeWidth: 2, r: 4 }}
              activeDot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
