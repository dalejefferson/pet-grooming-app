import { useMemo } from 'react'
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isWithinInterval,
  startOfDay,
  endOfDay,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/modules/ui/context'

export interface MiniCalendarProps {
  /** The currently displayed month */
  currentMonth: Date
  /** The currently selected date */
  selectedDate: Date
  /** For week view, the start and end of the selected week */
  weekRange?: { start: Date; end: Date }
  /** Callback when a day is clicked */
  onDateSelect: (date: Date) => void
  /** Callback when navigating to a different month */
  onMonthChange: (date: Date) => void
  /** Optional className for the container */
  className?: string
}

const WEEKDAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export function MiniCalendar({
  currentMonth,
  selectedDate,
  weekRange,
  onDateSelect,
  onMonthChange,
  className,
}: MiniCalendarProps) {
  const { colors } = useTheme()
  // Generate all days to display in the mini calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [currentMonth])

  const handlePrevMonth = () => {
    onMonthChange(subMonths(currentMonth, 1))
  }

  const handleNextMonth = () => {
    onMonthChange(addMonths(currentMonth, 1))
  }

  const isInWeekRange = (day: Date) => {
    if (!weekRange) return false
    return isWithinInterval(day, {
      start: startOfDay(weekRange.start),
      end: endOfDay(weekRange.end),
    })
  }

  const isToday = (day: Date) => {
    return isSameDay(day, new Date())
  }

  return (
    <div
      className={cn(
        'w-full sm:w-[220px] max-w-[320px] rounded-2xl border-2 border-[#1e293b] bg-white p-3 shadow-[3px_3px_0px_0px_#1e293b]',
        className
      )}
    >
      {/* Month Navigation Header */}
      <div className="mb-2 flex items-center justify-between">
        <button
          onClick={handlePrevMonth}
          className="flex h-8 w-8 sm:h-7 sm:w-7 items-center justify-center rounded-lg border-2 border-[#1e293b] bg-white shadow-[2px_2px_0px_0px_#1e293b] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#1e293b] active:translate-y-0 active:shadow-[1px_1px_0px_0px_#1e293b]"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4 text-[#334155]" />
        </button>
        <span className="text-sm font-bold text-[#1e293b]">
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        <button
          onClick={handleNextMonth}
          className="flex h-8 w-8 sm:h-7 sm:w-7 items-center justify-center rounded-lg border-2 border-[#1e293b] bg-white shadow-[2px_2px_0px_0px_#1e293b] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#1e293b] active:translate-y-0 active:shadow-[1px_1px_0px_0px_#1e293b]"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4 text-[#334155]" />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="mb-1 grid grid-cols-7 gap-0.5">
        {WEEKDAY_LABELS.map((day) => (
          <div
            key={day}
            className="flex h-7 sm:h-6 items-center justify-center text-[10px] font-semibold text-[#64748b]"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div className="grid grid-cols-7 gap-0.5 overflow-hidden rounded-b-xl">
        {calendarDays.map((day) => {
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isSelected = isSameDay(day, selectedDate)
          const inWeekRange = isInWeekRange(day)
          const dayIsToday = isToday(day)

          // Determine inline style for theme-based colors
          const getButtonStyle = () => {
            if (isSelected) {
              return { backgroundColor: colors.accentColorDark }
            }
            if (inWeekRange && !isSelected && isCurrentMonth) {
              return { backgroundColor: colors.accentColorLight }
            }
            return undefined
          }

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
              className={cn(
                'flex h-8 w-full sm:h-7 sm:w-7 items-center justify-center rounded-lg text-xs font-medium transition-all',
                // Base styles
                !isCurrentMonth && 'text-[#cbd5e1]',
                isCurrentMonth && !isSelected && !inWeekRange && 'text-[#334155] hover:bg-[var(--accent-color-light)]',
                // Today indicator
                dayIsToday && !isSelected && 'border-2 border-[var(--accent-color-dark)]',
                // Selected day (for day view)
                isSelected &&
                  'border-2 border-[#1e293b] text-[#1e293b] shadow-[2px_2px_0px_0px_#1e293b]',
                // In week range but not the selected day
                inWeekRange &&
                  !isSelected &&
                  isCurrentMonth &&
                  'text-[#1e293b]',
                // Hover effect
                !isSelected && 'hover:-translate-y-0.5'
              )}
              style={getButtonStyle()}
            >
              {format(day, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}
