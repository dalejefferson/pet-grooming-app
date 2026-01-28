import { Search, X } from 'lucide-react'
import { Card } from '../common'
import { cn } from '@/lib/utils'
import { useTheme } from '@/modules/ui/context'
import type { CalendarToolbarProps, ViewType } from './types'
import type { AppointmentStatus } from '@/types'
import { STATUS_BG_COLORS, STATUS_BORDER_COLORS, STATUS_TEXT_COLORS } from './types'

const viewButtons: { value: ViewType; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
]

const statusOptions: { value: AppointmentStatus; label: string }[] = [
  { value: 'requested', label: 'Requested' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'checked_in', label: 'Checked In' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No Show' },
]

/**
 * CalendarToolbar component provides navigation controls, view switcher,
 * and search functionality for the calendar.
 */
export function CalendarToolbar({
  view,
  searchQuery,
  filteredEventsCount,
  totalEventsCount,
  selectedStatuses,
  onPrevious,
  onNext,
  onToday,
  onViewChange,
  onSearchChange,
  onStatusFilterChange,
  getDisplayDate,
}: CalendarToolbarProps) {
  const { colors } = useTheme()

  const handleStatusToggle = (status: AppointmentStatus) => {
    if (selectedStatuses.includes(status)) {
      onStatusFilterChange(selectedStatuses.filter((s) => s !== status))
    } else {
      onStatusFilterChange([...selectedStatuses, status])
    }
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm">
      <div className="space-y-4">
        {/* Row 1: Title and Navigation */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Title and Date Navigation */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <h1 className="text-xl sm:text-2xl font-bold text-[#1e293b]">Calendar</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={onPrevious}
                className="flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-xl border-2 border-[#1e293b] bg-white shadow-[2px_2px_0px_0px_#1e293b] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#1e293b] active:translate-y-0 active:shadow-[1px_1px_0px_0px_#1e293b]"
                aria-label="Previous"
              >
                <svg className="h-5 w-5 text-[#334155]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={onToday}
                className="rounded-xl border-2 border-[#1e293b] px-4 py-2 sm:px-3 sm:py-1.5 text-sm font-semibold text-[#334155] shadow-[2px_2px_0px_0px_#1e293b] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#1e293b] active:translate-y-0 active:shadow-[1px_1px_0px_0px_#1e293b]"
                style={{
                  backgroundColor: colors.accentColor,
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.accentColorDark}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.accentColor}
              >
                Today
              </button>
              <button
                onClick={onNext}
                className="flex h-10 w-10 sm:h-9 sm:w-9 items-center justify-center rounded-xl border-2 border-[#1e293b] bg-white shadow-[2px_2px_0px_0px_#1e293b] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#1e293b] active:translate-y-0 active:shadow-[1px_1px_0px_0px_#1e293b]"
                aria-label="Next"
              >
                <svg className="h-5 w-5 text-[#334155]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* View Toggle Buttons */}
          <div className="flex items-center gap-1 rounded-xl border-2 border-[#1e293b] bg-white p-1 shadow-[2px_2px_0px_0px_#1e293b] self-start sm:self-auto">
            {viewButtons.map((btn) => (
              <button
                key={btn.value}
                onClick={() => onViewChange(btn.value)}
                className={cn(
                  'rounded-lg px-3 sm:px-4 py-2 sm:py-1.5 text-sm font-semibold transition-all min-h-[44px] sm:min-h-0',
                  view === btn.value
                    ? 'text-[#1e293b] shadow-inner border-2 border-[#1e293b]'
                    : 'bg-transparent text-[#334155] hover:bg-[var(--accent-color-light)]'
                )}
                style={view === btn.value ? { backgroundColor: colors.accentColorDark } : undefined}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Current Date Display */}
        <div className="text-center sm:text-left">
          <h2 className="text-lg sm:text-xl font-bold text-[#1e293b]">{getDisplayDate()}</h2>
        </div>

        {/* Row 3: Search Input */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search clients or pets..."
              className="w-full sm:w-64 rounded-xl border-2 border-[#1e293b] bg-white py-3 sm:py-2 pl-10 pr-10 text-sm text-[#1e293b] placeholder-[#94a3b8] shadow-[2px_2px_0px_0px_#1e293b] transition-all focus:outline-none focus:shadow-[3px_3px_0px_0px_#1e293b] focus:-translate-y-0.5"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b] transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {(searchQuery || selectedStatuses.length > 0) && (
            <div className="mt-1 text-xs text-[#64748b]">
              Showing {filteredEventsCount} of {totalEventsCount} appointments
            </div>
          )}
        </div>

        {/* Row 4: Status Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((status) => {
            const isActive = selectedStatuses.includes(status.value)
            return (
              <button
                key={status.value}
                onClick={() => handleStatusToggle(status.value)}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all border-2',
                  isActive
                    ? 'shadow-[2px_2px_0px_0px_#1e293b] -translate-y-0.5'
                    : 'border-transparent bg-gray-100 text-[#64748b] hover:bg-gray-200'
                )}
                style={
                  isActive
                    ? {
                        backgroundColor: STATUS_BG_COLORS[status.value],
                        borderColor: STATUS_BORDER_COLORS[status.value],
                        color: STATUS_TEXT_COLORS[status.value],
                      }
                    : undefined
                }
              >
                {status.label}
              </button>
            )
          })}
          {selectedStatuses.length > 0 && (
            <button
              onClick={() => onStatusFilterChange([])}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-[#64748b] hover:text-[#1e293b] hover:bg-gray-100 transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>
    </Card>
  )
}
