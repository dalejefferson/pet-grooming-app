import { Search, X } from 'lucide-react'
import { Card } from '../common'
import { cn } from '@/lib/utils'
import { useTheme } from '@/modules/ui/context'
import type { CalendarToolbarProps, ViewType } from './types'
import type { AppointmentStatus } from '@/types'
import { STATUS_BG_COLORS, STATUS_TEXT_COLORS } from './types'

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

// Helper sub-components
interface NavButtonsProps {
  onPrevious: () => void
  onNext: () => void
  onToday: () => void
  accentColor: string
  accentColorDark: string
}

function NavButtons({ onPrevious, onNext, onToday, accentColor, accentColorDark }: NavButtonsProps) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={onPrevious}
        className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#1e293b] bg-white shadow-[2px_2px_0px_0px_#1e293b] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#1e293b] active:translate-y-0 active:shadow-[1px_1px_0px_0px_#1e293b]"
        aria-label="Previous"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={onToday}
        className="rounded-xl border-2 border-[#1e293b] px-3 py-1.5 text-sm font-semibold shadow-[2px_2px_0px_0px_#1e293b] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#1e293b] active:translate-y-0 active:shadow-[1px_1px_0px_0px_#1e293b]"
        style={{ backgroundColor: accentColor, color: 'var(--text-on-primary)' }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = accentColorDark)}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = accentColor)}
        aria-label="Go to today"
      >
        Today
      </button>
      <button
        onClick={onNext}
        className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#1e293b] bg-white shadow-[2px_2px_0px_0px_#1e293b] transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#1e293b] active:translate-y-0 active:shadow-[1px_1px_0px_0px_#1e293b]"
        aria-label="Next"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}

interface ViewToggleProps {
  view: ViewType
  onViewChange: (view: ViewType) => void
  accentColorDark: string
}

function ViewToggle({ view, onViewChange, accentColorDark }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-0.5 rounded-xl border-2 border-[#1e293b] bg-white p-0.5 shadow-[2px_2px_0px_0px_#1e293b]">
      {viewButtons.map((btn) => (
        <button
          key={btn.value}
          onClick={() => onViewChange(btn.value)}
          aria-label={`Switch to ${btn.label.toLowerCase()} view`}
          aria-pressed={view === btn.value}
          className={cn(
            'w-16 rounded-lg px-2 py-1.5 text-sm font-semibold transition-all text-center',
            view === btn.value
              ? 'shadow-[1px_1px_0px_0px_#1e293b] border-2 border-[#1e293b]'
              : 'bg-transparent text-[#334155] hover:bg-[var(--accent-color-light)]'
          )}
          style={view === btn.value ? { backgroundColor: accentColorDark, color: 'var(--text-on-accent)' } : undefined}
        >
          {btn.label}
        </button>
      ))}
    </div>
  )
}

interface SearchInputProps {
  searchQuery: string
  onSearchChange: (query: string) => void
}

function SearchInput({ searchQuery, onSearchChange }: SearchInputProps) {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748b]" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search clients or pets..."
        className="w-56 rounded-xl border-2 border-[#1e293b] bg-white py-2 pl-10 pr-10 text-sm text-[#1e293b] placeholder-[#94a3b8] shadow-[2px_2px_0px_0px_#1e293b] transition-all focus:outline-none focus:shadow-[3px_3px_0px_0px_#1e293b] focus:-translate-y-0.5"
      />
      {searchQuery && (
        <button
          onClick={() => onSearchChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#1e293b] transition-colors"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

interface StatusFiltersProps {
  selectedStatuses: AppointmentStatus[]
  onStatusFilterChange: (statuses: AppointmentStatus[]) => void
}

function StatusFilters({ selectedStatuses, onStatusFilterChange }: StatusFiltersProps) {
  const handleStatusToggle = (status: AppointmentStatus) => {
    if (selectedStatuses.includes(status)) {
      onStatusFilterChange(selectedStatuses.filter((s) => s !== status))
    } else {
      onStatusFilterChange([...selectedStatuses, status])
    }
  }

  return (
    <div className="max-w-[360px] overflow-x-auto scrollbar-hide" style={{ scrollBehavior: 'smooth' }}>
      <div className="flex flex-nowrap items-center gap-1.5">
        {statusOptions.map((status) => {
          const isActive = selectedStatuses.includes(status.value)
          return (
            <button
              key={status.value}
              onClick={() => handleStatusToggle(status.value)}
              aria-label={`${isActive ? 'Hide' : 'Show'} ${status.label.toLowerCase()} appointments`}
              aria-pressed={isActive}
              className={cn(
                'h-8 flex items-center justify-center rounded-xl border-2 border-[#1e293b] px-3 whitespace-nowrap text-xs font-bold transition-all',
                isActive
                  ? 'shadow-[2px_2px_0px_0px_#1e293b] -translate-y-0.5'
                  : 'bg-white hover:bg-gray-50 hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#1e293b]'
              )}
              style={
                isActive
                  ? {
                      backgroundColor: STATUS_BG_COLORS[status.value],
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
            aria-label="Clear all status filters"
            className="h-8 w-8 flex-shrink-0 flex items-center justify-center rounded-xl border-2 border-[#1e293b] bg-white text-xs font-bold text-[#64748b] hover:text-[#1e293b] hover:bg-gray-50 hover:-translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#1e293b] transition-all"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * CalendarToolbar component provides navigation controls, view switcher,
 * search functionality, and status filters for the calendar.
 *
 * Single row layout with no wrapping for consistent display across all views.
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

  return (
    <Card className="bg-white/80 backdrop-blur-sm">
      {/* Single row - no wrapping */}
      <div className="flex flex-nowrap items-center gap-3 overflow-x-auto">
        {/* Title */}
        <h1 className="text-lg font-bold text-[#1e293b]">Calendar</h1>

        {/* Navigation buttons */}
        <NavButtons
          onPrevious={onPrevious}
          onNext={onNext}
          onToday={onToday}
          accentColor={colors.accentColor}
          accentColorDark={colors.accentColorDark}
        />

        {/* Current date display */}
        <span className="text-base font-semibold text-[#1e293b]">{getDisplayDate()}</span>

        {/* Status filters inline */}
        <StatusFilters
          selectedStatuses={selectedStatuses}
          onStatusFilterChange={onStatusFilterChange}
        />

        {/* Flex spacer to push search and view toggle to the right */}
        <div className="flex-1" />

        {/* Results count when filtering */}
        {(searchQuery || selectedStatuses.length > 0) && (
          <span className="text-xs text-[#64748b]">
            {filteredEventsCount}/{totalEventsCount}
          </span>
        )}

        {/* Search input */}
        <SearchInput
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />

        {/* View toggle */}
        <ViewToggle
          view={view}
          onViewChange={onViewChange}
          accentColorDark={colors.accentColorDark}
        />
      </div>
    </Card>
  )
}
