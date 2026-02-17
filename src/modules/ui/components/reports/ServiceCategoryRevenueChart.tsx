import { memo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { PieLabelRenderProps } from 'recharts'
import { Card, CardTitle } from '../common'
import type { ServiceCategoryDataPoint } from './types'
import type { ThemeColors } from '../../context/ThemeContext'

const TOOLTIP_CONTENT_STYLE = {
  backgroundColor: 'white',
  border: '2px solid #1e293b',
  borderRadius: '12px',
  boxShadow: '2px 2px 0px 0px #1e293b',
} as const

const CARD_ANIMATION_STYLE = { animation: 'fadeInUp 0.5s ease-out 0.8s forwards', opacity: 0 } as const

interface ServiceCategoryRevenueChartProps {
  data: ServiceCategoryDataPoint[]
  colors: ThemeColors
}

export const ServiceCategoryRevenueChart = memo(function ServiceCategoryRevenueChart({ data, colors }: ServiceCategoryRevenueChartProps) {
  // Map category names to theme colors
  const categoryColors: Record<string, string> = {
    Bath: colors.accentColor,
    Haircut: colors.secondaryAccent,
    Nail: colors.accentColorLight,
    Specialty: colors.accentColorDark,
    Package: colors.gradientVia,
  }

  // Custom label renderer for pie slices
  const renderLabel = (props: PieLabelRenderProps) => {
    const percent = props.percent ?? 0
    return `${(percent * 100).toFixed(1)}%`
  }

  // Format currency for tooltip
  const formatCurrency = (value: number | undefined) => {
    if (value === undefined) return '$0.00'
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <Card
      className="border-2 border-[#1e293b] rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] bg-white"
      style={CARD_ANIMATION_STYLE}
    >
      <CardTitle className="mb-4 text-[#1e293b]">Revenue by Service Category</CardTitle>
      <div className="h-[300px]" style={{ outline: 'none', cursor: 'default' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart style={{ outline: 'none' }}>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              labelLine={false}
              label={renderLabel}
              outerRadius={90}
              dataKey="revenue"
              nameKey="category"
              style={{ cursor: 'default' }}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={categoryColors[entry.category] || colors.accentColor}
                  stroke="#1e293b"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => [formatCurrency(value as number | undefined), 'Revenue']}
              contentStyle={TOOLTIP_CONTENT_STYLE}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value: string) => (
                <span style={{ color: '#334155', fontSize: '12px' }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
})
