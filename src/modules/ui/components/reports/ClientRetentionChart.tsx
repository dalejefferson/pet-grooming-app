import { memo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Card, CardTitle } from '../common'
import type { ClientRetentionDataPoint } from './types'
import type { ThemeColors } from '../../context/ThemeContext'

const TOOLTIP_CONTENT_STYLE = {
  backgroundColor: 'white',
  border: '2px solid #1e293b',
  borderRadius: '12px',
  boxShadow: '2px 2px 0px 0px #1e293b',
} as const

const CARD_ANIMATION_STYLE = { animation: 'fadeInUp 0.5s ease-out 0.5s forwards', opacity: 0 } as const

interface ClientRetentionChartProps {
  data: ClientRetentionDataPoint[]
  colors: ThemeColors
}

export const ClientRetentionChart = memo(function ClientRetentionChart({ data, colors }: ClientRetentionChartProps) {
  // Map data names to theme colors: New = light, Repeat = dark
  const getColorForSegment = (name: string) => {
    if (name.toLowerCase().includes('new')) {
      return colors.accentColorLight
    }
    return colors.accentColorDark
  }

  // Calculate total for percentage labels
  const total = data.reduce((sum, item) => sum + item.value, 0)

  // Custom label renderer for percentage display on pie slices
  const renderLabel = (props: {
    cx?: number
    cy?: number
    midAngle?: number
    innerRadius?: number
    outerRadius?: number
    value?: number
  }) => {
    const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, value = 0 } = props
    const RADIAN = Math.PI / 180
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5
    const x = cx + radius * Math.cos(-midAngle * RADIAN)
    const y = cy + radius * Math.sin(-midAngle * RADIAN)
    const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0

    return (
      <text
        x={x}
        y={y}
        fill="#1e293b"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={14}
        fontWeight={600}
      >
        {percentage}%
      </text>
    )
  }

  return (
    <Card
      className="border-2 border-[#1e293b] rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] bg-white"
      style={CARD_ANIMATION_STYLE}
    >
      <CardTitle className="mb-4 text-[#1e293b]">Client Retention</CardTitle>
      <div className="h-[300px]" style={{ outline: 'none', cursor: 'default' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart style={{ outline: 'none' }}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderLabel}
              outerRadius={100}
              dataKey="value"
              style={{ cursor: 'default', outline: 'none' }}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getColorForSegment(entry.name)}
                  stroke="#1e293b"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={TOOLTIP_CONTENT_STYLE}
            />
            <Legend
              wrapperStyle={{
                fontSize: '14px',
                fontWeight: 500,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
})
