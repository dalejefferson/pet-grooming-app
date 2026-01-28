import type { Appointment, AppointmentStatus, Pet, Groomer, Client, Service } from '@/types'

// Hover popup position type
export interface HoverPosition {
  x: number
  y: number
}

// Calendar event for react-big-calendar
export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resource: Appointment
  clientName: string
  petNames: string
  serviceSummary: string
}

// Interface for pending move state (drag & drop)
export interface PendingMove {
  event: CalendarEvent
  start: Date
  end: Date
  isResize: boolean
}

// Interface for pet service selection in create appointment form
export interface PetServiceSelection {
  petId: string
  serviceIds: string[]
}

// Props for the HoverPopup component
export interface HoverPopupProps {
  appointment: Appointment
  position: HoverPosition
  clients: Client[]
  pets: Pet[]
  groomers: Groomer[]
}

// Custom event component props interface
export interface CustomEventProps {
  event: CalendarEvent
  onMouseEnter?: (event: CalendarEvent, e: React.MouseEvent) => void
  onMouseLeave?: () => void
}

// Calendar toolbar props
export interface CalendarToolbarProps {
  view: 'day' | 'week' | 'month'
  searchQuery: string
  filteredEventsCount: number
  totalEventsCount: number
  selectedStatuses: AppointmentStatus[]
  onPrevious: () => void
  onNext: () => void
  onToday: () => void
  onViewChange: (view: 'day' | 'week' | 'month') => void
  onSearchChange: (query: string) => void
  onStatusFilterChange: (statuses: AppointmentStatus[]) => void
  getDisplayDate: () => string
}

// Appointment details drawer props
export interface AppointmentDetailsDrawerProps {
  appointment: Appointment | null
  onClose: () => void
  clients: Client[]
  pets: Pet[]
  groomers: Groomer[]
  onStatusChange: (status: AppointmentStatus) => Promise<void>
  onQuickStatusChange: (status: 'no_show' | 'cancelled') => void
}

// Create appointment modal props
export interface CreateAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  clients: Client[]
  clientPets: Pet[]
  services: Service[]
  groomers: Groomer[]
  initialStartTime: string
  initialEndTime: string
  onClientChange: (clientId: string) => void
  selectedClientId: string
  onCreateAppointment: (data: {
    clientId: string
    petServices: PetServiceSelection[]
    groomerId: string
    notes: string
    startTime: string
    endTime: string
  }) => Promise<void>
  isCreating: boolean
}

// Reschedule confirmation modal props
export interface RescheduleConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  pendingMove: PendingMove | null
  onConfirm: () => Promise<void>
  isUpdating: boolean
}

// Status change modal props
export interface StatusChangeModalProps {
  isOpen: boolean
  onClose: () => void
  pendingStatus: AppointmentStatus | null
  notes: string
  onNotesChange: (notes: string) => void
  onConfirm: () => Promise<void>
  isUpdating: boolean
}

// Pastel status colors matching the theme
export const STATUS_BG_COLORS: Record<AppointmentStatus, string> = {
  requested: '#fef9c3', // lemon
  confirmed: '#d1fae5', // mint
  checked_in: '#e9d5ff', // lavender
  in_progress: '#ecfccb', // lime
  completed: '#6F8F72', // primary green
  cancelled: '#e5e7eb', // gray
  no_show: '#fce7f3', // pink
}

export const STATUS_TEXT_COLORS: Record<AppointmentStatus, string> = {
  requested: '#854d0e', // dark amber
  confirmed: '#065f46', // dark green
  checked_in: '#6b21a8', // dark purple
  in_progress: '#3f6212', // dark lime
  completed: '#ffffff', // white (for filled background)
  cancelled: '#374151', // dark gray
  no_show: '#9d174d', // dark pink
}

export const STATUS_BORDER_COLORS: Record<AppointmentStatus, string> = {
  requested: '#fbbf24',
  confirmed: '#34d399',
  checked_in: '#a855f7',
  in_progress: '#84cc16',
  completed: '#49634c',
  cancelled: '#9ca3af',
  no_show: '#f472b6',
}

export type ViewType = 'day' | 'week' | 'month'
