import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardTitle } from '@/components/common'
import type { ClientAcquisitionDataPoint } from './types'
import { PASTEL_COLORS } from './types'

interface NewClientsChartProps {
  data: ClientAcquisitionDataPoint[]
}

export function NewClientsChart({ data }: NewClientsChartProps) {
  return (
    <Card
      className="border-2 border-[#1e293b] rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] bg-white"
      style={{ animation: 'fadeInUp 0.5s ease-out 0.4s forwards', opacity: 0 }}
    >
      <CardTitle className="mb-4 text-[#1e293b]">New Clients Over Time</CardTitle>
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
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '2px solid #1e293b',
                borderRadius: '12px',
                boxShadow: '2px 2px 0px 0px #1e293b',
              }}
            />
            <Line
              type="monotone"
              dataKey="clients"
              stroke="#8b5cf6"
              strokeWidth={3}
              dot={{ fill: PASTEL_COLORS.lavender, stroke: '#8b5cf6', strokeWidth: 2, r: 4 }}
              activeDot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
