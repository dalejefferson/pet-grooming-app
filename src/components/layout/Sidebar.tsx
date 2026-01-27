import { NavLink } from 'react-router-dom'
import {
  Calendar,
  Users,
  Dog,
  UserCircle,
  Scissors,
  FileText,
  Bell,
  BarChart3,
  LayoutDashboard,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLogout } from '@/hooks'
import { APP_NAME } from '@/config/constants'
import { useTheme } from '@/context/ThemeContext'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  isMobile?: boolean
  onClose?: () => void
}

const navItems = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/app/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/app/clients', icon: Users, label: 'Clients' },
  { to: '/app/pets', icon: Dog, label: 'Pets' },
  { to: '/app/groomers', icon: UserCircle, label: 'Groomers' },
  { to: '/app/services', icon: Scissors, label: 'Services' },
  { to: '/app/policies', icon: FileText, label: 'Policies' },
  { to: '/app/reminders', icon: Bell, label: 'Reminders' },
  { to: '/app/reports', icon: BarChart3, label: 'Reports' },
]

export function Sidebar({ collapsed, onToggle, isMobile = false, onClose }: SidebarProps) {
  const logout = useLogout()
  const { colors } = useTheme()

  // On mobile, we always show the full sidebar (not collapsed)
  const effectiveCollapsed = isMobile ? false : collapsed

  const handleNavClick = () => {
    // Close sidebar on mobile when a nav item is clicked
    if (isMobile && onClose) {
      onClose()
    }
  }

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 flex flex-col border-r-2 border-[#1e293b] shadow-[3px_0px_0px_0px_#1e293b] transition-all duration-150',
        colors.sidebarGradient,
        // On mobile, always full width; on desktop, respect collapsed state
        isMobile ? 'w-64 rounded-r-none' : 'rounded-r-3xl',
        !isMobile && (effectiveCollapsed ? 'w-20' : 'w-64')
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex h-16 items-center gap-2 border-b-2 border-[#1e293b] transition-all duration-150',
          effectiveCollapsed ? 'justify-center px-2' : 'justify-between px-6'
        )}
      >
        <div className="flex items-center gap-2">
          <Dog className="h-8 w-8 text-[#1e293b] flex-shrink-0" />
          <span
            className={cn(
              'text-lg font-bold text-[#1e293b] whitespace-nowrap transition-all duration-150',
              effectiveCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
            )}
          >
            {APP_NAME}
          </span>
        </div>
        {/* Mobile close button */}
        {isMobile && onClose && (
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#1e293b] bg-white text-[#1e293b] shadow-[2px_2px_0px_0px_#1e293b] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#1e293b]"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={handleNavClick}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center rounded-xl text-sm transition-all duration-150',
                // Ensure touch targets are at least 44px on mobile
                isMobile ? 'min-h-[44px] gap-3 px-3 py-2.5' : (
                  effectiveCollapsed
                    ? 'h-10 w-10 justify-center mx-auto'
                    : 'gap-3 px-3 py-2.5'
                ),
                isActive ? 'nav-link-active' : 'nav-link-inactive'
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span
              className={cn(
                'whitespace-nowrap transition-all duration-150',
                effectiveCollapsed && !isMobile ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
              )}
            >
              {item.label}
            </span>
            {/* Tooltip for collapsed state (desktop only) */}
            {effectiveCollapsed && !isMobile && (
              <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-lg border-2 border-[#1e293b] bg-white px-2 py-1 text-sm font-medium text-[#1e293b] opacity-0 shadow-[2px_2px_0px_0px_#1e293b] transition-opacity duration-150 group-hover:opacity-100">
                {item.label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t-2 border-[#1e293b] p-4">
        <NavLink
          to="/app/settings"
          onClick={handleNavClick}
          className={({ isActive }) =>
            cn(
              'group relative flex items-center rounded-xl text-sm transition-all duration-150',
              isMobile ? 'min-h-[44px] gap-3 px-3 py-2.5' : (
                effectiveCollapsed
                  ? 'h-10 w-10 justify-center mx-auto'
                  : 'gap-3 px-3 py-2.5'
              ),
              isActive ? 'nav-link-active' : 'nav-link-inactive'
            )
          }
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          <span
            className={cn(
              'whitespace-nowrap transition-all duration-150',
              effectiveCollapsed && !isMobile ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
            )}
          >
            Settings
          </span>
          {/* Tooltip for collapsed state (desktop only) */}
          {effectiveCollapsed && !isMobile && (
            <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-lg border-2 border-[#1e293b] bg-white px-2 py-1 text-sm font-medium text-[#1e293b] opacity-0 shadow-[2px_2px_0px_0px_#1e293b] transition-opacity duration-150 group-hover:opacity-100">
              Settings
            </span>
          )}
        </NavLink>
        <button
          onClick={() => {
            logout.mutate()
            handleNavClick()
          }}
          className={cn(
            'group relative nav-link-inactive flex items-center rounded-xl text-sm transition-all duration-150',
            isMobile ? 'min-h-[44px] w-full gap-3 px-3 py-2.5' : (
              effectiveCollapsed
                ? 'h-10 w-10 justify-center mx-auto mt-1'
                : 'w-full gap-3 px-3 py-2.5'
            )
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span
            className={cn(
              'whitespace-nowrap transition-all duration-150',
              effectiveCollapsed && !isMobile ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
            )}
          >
            Log out
          </span>
          {/* Tooltip for collapsed state (desktop only) */}
          {effectiveCollapsed && !isMobile && (
            <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-lg border-2 border-[#1e293b] bg-white px-2 py-1 text-sm font-medium text-[#1e293b] opacity-0 shadow-[2px_2px_0px_0px_#1e293b] transition-opacity duration-150 group-hover:opacity-100">
              Log out
            </span>
          )}
        </button>

        {/* Collapse Toggle Button - Only show on desktop */}
        {!isMobile && (
          <button
            onClick={onToggle}
            className="mt-4 flex w-full items-center justify-center rounded-xl border-2 border-[#1e293b] bg-white p-2 text-[#1e293b] shadow-[2px_2px_0px_0px_#1e293b] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#1e293b]"
            aria-label={effectiveCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {effectiveCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        )}
      </div>
    </aside>
  )
}
