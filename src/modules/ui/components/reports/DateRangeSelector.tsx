import { cn } from '@/lib/utils'
import type { DateRange } from './types'
import { DATE_RANGES } from './types'
import type { ThemeColors } from '../../context/ThemeContext'

interface DateRangeSelectorProps {
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
  colors: ThemeColors
}

export function DateRangeSelector({ dateRange, onDateRangeChange, colors }: DateRangeSelectorProps) {
  return (
    <div className="flex rounded-xl border-2 border-[#1e293b] bg-white overflow-hidden shadow-[2px_2px_0px_0px_#1e293b]">
      {DATE_RANGES.map((range) => (
        <button
          key={range.days}
          onClick={() => onDateRangeChange(range)}
          className={cn(
            'px-3 py-2 text-sm font-medium transition-colors',
            dateRange.days !== range.days && 'text-[#334155]'
          )}
          style={{
            backgroundColor: dateRange.days === range.days ? colors.accentColor : undefined,
            color: dateRange.days === range.days ? colors.textOnPrimary : undefined,
          }}
          onMouseEnter={(e) => {
            if (dateRange.days !== range.days) {
              e.currentTarget.style.backgroundColor = colors.secondaryAccent
              e.currentTarget.style.color = colors.textOnSecondary
            }
          }}
          onMouseLeave={(e) => {
            if (dateRange.days !== range.days) {
              e.currentTarget.style.backgroundColor = ''
              e.currentTarget.style.color = ''
            }
          }}
        >
          {range.label}
        </button>
      ))}
    </div>
  )
}
