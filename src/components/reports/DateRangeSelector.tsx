import { cn } from '@/lib/utils'
import type { DateRange } from './types'
import { DATE_RANGES } from './types'

interface DateRangeSelectorProps {
  dateRange: DateRange
  onDateRangeChange: (range: DateRange) => void
}

export function DateRangeSelector({ dateRange, onDateRangeChange }: DateRangeSelectorProps) {
  return (
    <div className="flex rounded-xl border-2 border-[#1e293b] bg-white overflow-hidden shadow-[2px_2px_0px_0px_#1e293b]">
      {DATE_RANGES.map((range) => (
        <button
          key={range.days}
          onClick={() => onDateRangeChange(range)}
          className={cn(
            'px-3 py-2 text-sm font-medium transition-colors',
            dateRange.days === range.days
              ? 'bg-[#d1fae5] text-[#1e293b]'
              : 'text-[#334155] hover:bg-[#fef9c3]'
          )}
        >
          {range.label}
        </button>
      ))}
    </div>
  )
}
