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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLogout } from '@/hooks'
import { APP_NAME } from '@/config/constants'
import { useTheme } from '@/context/ThemeContext'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
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

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const logout = useLogout()
  const { colors } = useTheme()

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-30 flex flex-col rounded-r-3xl border-r-2 border-[#1e293b] shadow-[3px_0px_0px_0px_#1e293b] transition-all duration-150',
        colors.sidebarGradient,
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex h-16 items-center gap-2 border-b-2 border-[#1e293b] transition-all duration-150',
          collapsed ? 'justify-center px-2' : 'px-6'
        )}
      >
        <Dog className="h-8 w-8 text-[#1e293b] flex-shrink-0" />
        <span
          className={cn(
            'text-lg font-bold text-[#1e293b] whitespace-nowrap transition-all duration-150',
            collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
          )}
        >
          {APP_NAME}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150',
                collapsed && 'justify-center px-2',
                isActive ? 'nav-link-active' : 'nav-link-inactive'
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            <span
              className={cn(
                'whitespace-nowrap transition-all duration-150',
                collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
              )}
            >
              {item.label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t-2 border-[#1e293b] p-4">
        <NavLink
          to="/app/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150',
              collapsed && 'justify-center px-2',
              isActive ? 'nav-link-active' : 'nav-link-inactive'
            )
          }
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          <span
            className={cn(
              'whitespace-nowrap transition-all duration-150',
              collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
            )}
          >
            Settings
          </span>
        </NavLink>
        <button
          onClick={() => logout.mutate()}
          className={cn(
            'nav-link-inactive flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150',
            collapsed && 'justify-center px-2'
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          <span
            className={cn(
              'whitespace-nowrap transition-all duration-150',
              collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
            )}
          >
            Log out
          </span>
        </button>

        {/* Collapse Toggle Button */}
        <button
          onClick={onToggle}
          className="mt-4 flex w-full items-center justify-center rounded-xl border-2 border-[#1e293b] bg-white p-2 text-[#1e293b] shadow-[2px_2px_0px_0px_#1e293b] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#1e293b]"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>
    </aside>
  )
}
