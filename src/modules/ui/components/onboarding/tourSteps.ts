import type { RolePermissions } from '@/types'

export interface TourStep {
  id: string
  page: string
  target: string
  title: string
  description: string
  preferredPlacement: 'top' | 'bottom' | 'left' | 'right'
  permission: keyof RolePermissions | null
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'sidebar-nav',
    page: '/app/dashboard',
    target: 'sidebar-navigation',
    title: 'Your Navigation Hub',
    description:
      "Navigate between all your salon's pages — dashboard, calendar, clients, and more.",
    preferredPlacement: 'right',
    permission: null,
  },
  {
    id: 'dashboard-stats',
    page: '/app/dashboard',
    target: 'dashboard-stats-grid',
    title: 'At-a-Glance Stats',
    description:
      'See your daily appointments, total clients, pets, and active staff at a glance.',
    preferredPlacement: 'bottom',
    permission: null,
  },
  {
    id: 'dashboard-schedule',
    page: '/app/dashboard',
    target: 'dashboard-today-schedule',
    title: "Today's Schedule",
    description:
      'Your daily appointment timeline. Click any appointment for details.',
    preferredPlacement: 'top',
    permission: null,
  },
  {
    id: 'calendar-toolbar',
    page: '/app/calendar',
    target: 'calendar-toolbar',
    title: 'Calendar Controls',
    description:
      'Switch between day, week, and month views. Search and filter appointments.',
    preferredPlacement: 'bottom',
    permission: null,
  },
  {
    id: 'calendar-grid',
    page: '/app/calendar',
    target: 'calendar-grid',
    title: 'Your Appointment Calendar',
    description:
      'Drag and drop to reschedule. Click any slot to create a new appointment.',
    preferredPlacement: 'top',
    permission: null,
  },
  {
    id: 'clients-header',
    page: '/app/clients',
    target: 'clients-page-header',
    title: 'Client Management',
    description:
      'View and manage your client database. Add new clients and track their pets.',
    preferredPlacement: 'bottom',
    permission: 'canManageClients',
  },
  {
    id: 'services-header',
    page: '/app/services',
    target: 'services-page-header',
    title: 'Service Catalog',
    description:
      'Set up your grooming services with pricing, duration, and modifiers.',
    preferredPlacement: 'bottom',
    permission: 'canManageServices',
  },
  {
    id: 'staff-header',
    page: '/app/staff',
    target: 'staff-page-header',
    title: 'Team Management',
    description:
      "Manage your team's roles, schedules, and time-off requests.",
    preferredPlacement: 'bottom',
    permission: 'canManageStaff',
  },
  {
    id: 'settings-header',
    page: '/app/settings',
    target: 'settings-page-header',
    title: 'Your Settings',
    description:
      'Customize your business info, theme, email settings, and billing.',
    preferredPlacement: 'bottom',
    permission: 'canManageSettings',
  },
]
