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
import type { StatusDataPoint } from './types'

const TOOLTIP_CONTENT_STYLE = {
  backgroundColor: 'white',
  border: '2px solid #1e293b',
  borderRadius: '12px',
  boxShadow: '2px 2px 0px 0px #1e293b',
} as const

const CARD_ANIMATION_STYLE = { animation: 'fadeInUp 0.5s ease-out 0.2s forwards', opacity: 0 } as const

interface AppointmentsChartProps {
  data: StatusDataPoint[]
}

export const AppointmentsChart = memo(function AppointmentsChart({ data }: AppointmentsChartProps) {
  return (
    <Card
      className="border-2 border-[#1e293b] rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] bg-white"
      style={CARD_ANIMATION_STYLE}
    >
      <CardTitle className="mb-4 text-[#1e293b]">Appointments by Status</CardTitle>
      <div className="h-[300px]" style={{ outline: 'none', cursor: 'default' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} style={{ outline: 'none' }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="status"
              tick={{ fontSize: 11, fill: '#334155' }}
              tickLine={{ stroke: '#334155' }}
              interval={0}
              angle={-20}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#334155' }}
              tickLine={{ stroke: '#334155' }}
            />
            <Tooltip
              contentStyle={TOOLTIP_CONTENT_STYLE}
            />
            <Bar dataKey="count" radius={[8, 8, 0, 0]} style={{ cursor: 'default' }}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} stroke="#1e293b" strokeWidth={2} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
})
