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
import type { TopServiceDataPoint } from './types'
import type { ThemeColors } from '../../context/ThemeContext'

interface TopServicesChartProps {
  data: TopServiceDataPoint[]
  colors: ThemeColors
}

export function TopServicesChart({ data, colors }: TopServicesChartProps) {
  // Create an array of theme colors for the bars
  const themeBarColors = [
    colors.accentColor,
    colors.secondaryAccent,
    colors.accentColorLight,
    colors.accentColorDark,
    colors.gradientVia,
  ]

  return (
    <Card
      className="border-2 border-[#1e293b] rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] bg-white"
      style={{ animation: 'fadeInUp 0.5s ease-out 0.3s forwards', opacity: 0 }}
    >
      <CardTitle className="mb-4 text-[#1e293b]">Top Services</CardTitle>
      <div className="h-[300px]" style={{ outline: 'none', cursor: 'default' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" style={{ outline: 'none' }}>
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
              width={100}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '2px solid #1e293b',
                borderRadius: '12px',
                boxShadow: '2px 2px 0px 0px #1e293b',
              }}
            />
            <Bar dataKey="count" radius={[0, 8, 8, 0]} style={{ cursor: 'default' }}>
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={themeBarColors[index % themeBarColors.length]}
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
}
