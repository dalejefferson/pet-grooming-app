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
import type { AppointmentStatus } from '@/types'

/** Status color map for dot indicators */
const DOT_COLORS: Record<AppointmentStatus, string> = {
  requested: '#fbbf24',
  confirmed: '#34d399',
  checked_in: '#a855f7',
  in_progress: '#84cc16',
  completed: '#6F8F72',
  cancelled: '#9ca3af',
  no_show: '#f472b6',
}

export interface MiniCalendarProps {
  /** The currently displayed month */
  currentMonth: Date
  /** The currently selected date */
  selectedDate: Date
  /** For week view, the start and end of the selected week */
  weekRange?: { start: Date; end: Date }
  /** Map of date strings (yyyy-MM-dd) to appointment statuses for dot indicators */
  appointmentsByDate?: Map<string, AppointmentStatus[]>
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
  appointmentsByDate,
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
        'w-full sm:w-[260px] max-w-[320px] rounded-2xl border-2 border-[#1e293b] bg-white p-3 shadow-[3px_3px_0px_0px_#1e293b]',
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
      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAY_LABELS.map((day) => (
          <div
            key={day}
            className="flex h-6 items-center justify-center text-[10px] font-semibold text-[#64748b]"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div className="grid grid-cols-7 gap-1 overflow-hidden rounded-b-xl">
        {calendarDays.map((day) => {
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isSelected = isSameDay(day, selectedDate)
          const inWeekRange = isInWeekRange(day)
          const dayIsToday = isToday(day)
          const dateKey = format(day, 'yyyy-MM-dd')
          const dayStatuses = appointmentsByDate?.get(dateKey)
          const uniqueStatuses = dayStatuses ? [...new Set(dayStatuses)].slice(0, 3) : []

          // Determine inline style for theme-based colors
          const getButtonStyle = () => {
            if (isSelected) {
              return { backgroundColor: colors.accentColorDark, color: colors.textOnAccent }
            }
            if (inWeekRange && !isSelected && isCurrentMonth) {
              return { backgroundColor: colors.accentColorLight, color: colors.textOnAccentLight }
            }
            return undefined
          }

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateSelect(day)}
              className={cn(
                'flex h-8 w-8 flex-col items-center justify-center rounded-lg text-xs font-medium transition-all',
                // Base styles
                !isCurrentMonth && 'text-[#cbd5e1]',
                isCurrentMonth && !isSelected && !inWeekRange && 'text-[#334155] hover:bg-[var(--accent-color-light)]',
                // Today indicator
                dayIsToday && !isSelected && 'border-2 border-[var(--accent-color-dark)]',
                // Selected day (for day view)
                isSelected &&
                  'border-2 border-[#1e293b] shadow-[2px_2px_0px_0px_#1e293b]',
                // Hover effect
                !isSelected && 'hover:-translate-y-0.5'
              )}
              style={getButtonStyle()}
            >
              <span className="leading-none">{format(day, 'd')}</span>
              {uniqueStatuses.length > 0 && (
                <span className="flex gap-px mt-0.5">
                  {uniqueStatuses.map((status) => (
                    <span
                      key={status}
                      className="h-1 w-1 rounded-full"
                      style={{ backgroundColor: DOT_COLORS[status] }}
                    />
                  ))}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
