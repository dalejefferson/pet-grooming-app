import { memo } from 'react'
import { Card, CardTitle } from '../common'
import type { ThemeColors } from '../../context/ThemeContext'
import type { PeakHoursData } from './types'

const CARD_ANIMATION_STYLE = { animation: 'fadeInUp 0.5s ease-out 0.7s forwards', opacity: 0 } as const

export interface PeakHoursChartProps {
  data: PeakHoursData
  colors: ThemeColors
}

// Days of the week starting from Monday
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
// Day indices: Monday=1, Tuesday=2, ..., Sunday=0 (JavaScript convention mapped)
const DAY_INDICES = [1, 2, 3, 4, 5, 6, 0]

// Business hours: 8am to 6pm
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]

function formatHour(hour: number): string {
  if (hour === 12) return '12p'
  if (hour > 12) return `${hour - 12}p`
  return `${hour}a`
}

/**
 * Interpolates between two hex colors based on a ratio (0-1)
 */
function interpolateColor(color1: string, color2: string, ratio: number): string {
  const hex1 = color1.replace('#', '')
  const hex2 = color2.replace('#', '')

  const r1 = parseInt(hex1.substring(0, 2), 16)
  const g1 = parseInt(hex1.substring(2, 4), 16)
  const b1 = parseInt(hex1.substring(4, 6), 16)

  const r2 = parseInt(hex2.substring(0, 2), 16)
  const g2 = parseInt(hex2.substring(2, 4), 16)
  const b2 = parseInt(hex2.substring(4, 6), 16)

  const r = Math.round(r1 + (r2 - r1) * ratio)
  const g = Math.round(g1 + (g2 - g1) * ratio)
  const b = Math.round(b1 + (b2 - b1) * ratio)

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

/**
 * Gets the background color for a cell based on appointment count
 * Color scale: white (0) -> accentColorLight (low) -> accentColor (medium) -> accentColorDark (high)
 */
function getCellColor(count: number, maxCount: number, colors: ThemeColors): string {
  if (count === 0 || maxCount === 0) return '#ffffff'

  const ratio = count / maxCount

  if (ratio <= 0.33) {
    // Low: white to accentColorLight
    return interpolateColor('#ffffff', colors.accentColorLight, ratio / 0.33)
  } else if (ratio <= 0.66) {
    // Medium: accentColorLight to accentColor
    return interpolateColor(colors.accentColorLight, colors.accentColor, (ratio - 0.33) / 0.33)
  } else {
    // High: accentColor to accentColorDark
    return interpolateColor(colors.accentColor, colors.accentColorDark, (ratio - 0.66) / 0.34)
  }
}

export const PeakHoursChart = memo(function PeakHoursChart({ data, colors }: PeakHoursChartProps) {
  const { grid, maxCount } = data

  return (
    <Card
      className="border-2 border-[#1e293b] rounded-2xl shadow-[3px_3px_0px_0px_#1e293b] bg-white"
      style={CARD_ANIMATION_STYLE}
    >
      <CardTitle className="mb-4 text-[#1e293b]">Peak Hours</CardTitle>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {/* Empty corner cell */}
              <th className="w-12 p-1" />
              {/* Hour headers */}
              {HOURS.map((hour) => (
                <th
                  key={hour}
                  className="p-1 text-xs font-semibold text-[#334155] text-center"
                >
                  {formatHour(hour)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day, dayIndex) => {
              const actualDayIndex = DAY_INDICES[dayIndex]
              return (
                <tr key={day}>
                  {/* Day label */}
                  <td className="p-1 text-xs font-semibold text-[#334155] text-right pr-2">
                    {day}
                  </td>
                  {/* Hour cells */}
                  {HOURS.map((hour) => {
                    const key = `${actualDayIndex}-${hour}`
                    const count = grid[key] || 0
                    const cellColor = getCellColor(count, maxCount, colors)

                    return (
                      <td key={hour} className="p-0.5">
                        <div
                          className="w-6 h-6 sm:w-7 sm:h-7 rounded-md border-2 border-[#1e293b] flex items-center justify-center transition-all hover:scale-110 cursor-default"
                          style={{ backgroundColor: cellColor }}
                          title={`${day} ${formatHour(hour)}: ${count} appointment${count !== 1 ? 's' : ''}`}
                        >
                          {count > 0 && (
                            <span className="text-[8px] sm:text-[10px] font-bold text-[#1e293b]">
                              {count}
                            </span>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#334155]">
        <span className="font-medium">Less</span>
        <div className="flex items-center gap-0.5">
          <div
            className="w-4 h-4 rounded border-2 border-[#1e293b]"
            style={{ backgroundColor: '#ffffff' }}
          />
          <div
            className="w-4 h-4 rounded border-2 border-[#1e293b]"
            style={{ backgroundColor: colors.accentColorLight }}
          />
          <div
            className="w-4 h-4 rounded border-2 border-[#1e293b]"
            style={{ backgroundColor: colors.accentColor }}
          />
          <div
            className="w-4 h-4 rounded border-2 border-[#1e293b]"
            style={{ backgroundColor: colors.accentColorDark }}
          />
        </div>
        <span className="font-medium">More</span>
      </div>
    </Card>
  )
})
