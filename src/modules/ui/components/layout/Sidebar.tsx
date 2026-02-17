import { useState, useRef, useCallback, useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Calendar,
  Users,
  Dog,
  Users2,
  Scissors,
  FileText,
  Bell,
  BarChart3,
  LayoutDashboard,
  CreditCard,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLogout } from '@/hooks'
import { usePermissions } from '@/modules/auth'
import { APP_NAME } from '@/config/constants'
import { useTheme } from '../../context'
import type { RolePermissions } from '@/types'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  isMobile?: boolean
  onClose?: () => void
}

interface TooltipState {
  visible: boolean
  label: string
  top: number
}

// Sidebar tooltip component that uses fixed positioning to escape overflow clipping
function SidebarTooltip({ visible, label, top }: TooltipState) {
  if (!visible) return null

  return (
    <div
      className="pointer-events-none fixed z-50 whitespace-nowrap rounded-xl border-2 border-[#1e293b] bg-white px-3 py-1.5 text-sm font-medium text-[#1e293b] shadow-[2px_2px_0px_0px_#1e293b] transition-opacity duration-150"
      style={{
        left: '88px', // 80px sidebar width + 8px gap
        top: `${top}px`,
        opacity: visible ? 1 : 0,
      }}
    >
      {label}
    </div>
  )
}

const navItems: { to: string; icon: typeof LayoutDashboard; label: string; permission: keyof RolePermissions | null }[] = [
  { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard', permission: null },
  { to: '/app/calendar', icon: Calendar, label: 'Calendar', permission: null },
  { to: '/app/clients', icon: Users, label: 'Clients', permission: 'canManageClients' },
  { to: '/app/pets', icon: Dog, label: 'Pets', permission: 'canManageClients' },
  { to: '/app/staff', icon: Users2, label: 'Staff', permission: 'canManageStaff' },
  { to: '/app/services', icon: Scissors, label: 'Services', permission: 'canManageServices' },
  { to: '/app/policies', icon: FileText, label: 'Policies', permission: 'canManagePolicies' },
  { to: '/app/reminders', icon: Bell, label: 'Reminders', permission: 'canManagePolicies' },
  { to: '/app/reports', icon: BarChart3, label: 'Reports', permission: 'canViewReports' },
]

export function Sidebar({ collapsed, onToggle, isMobile = false, onClose }: SidebarProps) {
  const logout = useLogout()
  const { colors } = useTheme()
  const { hasPermission } = usePermissions()

  const visibleNavItems = useMemo(
    () => navItems.filter((item) => item.permission === null || hasPermission(item.permission)),
    [hasPermission]
  )
  const [tooltip, setTooltip] = useState<TooltipState>({ visible: false, label: '', top: 0 })
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // On mobile, we always show the full sidebar (not collapsed)
  const effectiveCollapsed = isMobile ? false : collapsed

  const handleNavClick = () => {
    // Close sidebar on mobile when a nav item is clicked
    if (isMobile && onClose) {
      onClose()
    }
  }

  const showTooltip = useCallback((label: string, element: HTMLElement) => {
    if (!effectiveCollapsed || isMobile) return

    // Clear any pending hide timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }

    const rect = element.getBoundingClientRect()
    // Center the tooltip vertically with the nav item
    const top = rect.top + rect.height / 2 - 14 // 14px is approximately half the tooltip height
    setTooltip({ visible: true, label, top })
  }, [effectiveCollapsed, isMobile])

  const hideTooltip = useCallback(() => {
    // Small delay to prevent flickering when moving between items
    hideTimeoutRef.current = setTimeout(() => {
      setTooltip(prev => ({ ...prev, visible: false }))
    }, 50)
  }, [])

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
          <Dog className="h-8 w-8 flex-shrink-0" style={{ color: colors.textOnSidebar }} />
          <span
            className={cn(
              'text-lg font-bold whitespace-nowrap transition-all duration-150',
              effectiveCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
            )}
            style={{ color: colors.textOnSidebar }}
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
      <nav data-tour-step="sidebar-navigation" className="flex-1 space-y-1 overflow-y-auto p-4">
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={handleNavClick}
            onMouseEnter={(e) => showTooltip(item.label, e.currentTarget)}
            onMouseLeave={hideTooltip}
            aria-label={item.label}
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
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t-2 border-[#1e293b] p-4">
        {hasPermission('canManageSettings') && (
          <NavLink
            to="/app/billing"
            onClick={handleNavClick}
            onMouseEnter={(e) => showTooltip('Billing', e.currentTarget)}
            onMouseLeave={hideTooltip}
            aria-label="Billing"
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
            <CreditCard className="h-5 w-5 flex-shrink-0" />
            <span
              className={cn(
                'whitespace-nowrap transition-all duration-150',
                effectiveCollapsed && !isMobile ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
              )}
            >
              Billing
            </span>
          </NavLink>
        )}
        {hasPermission('canManageSettings') && (
          <NavLink
            to="/app/settings"
            onClick={handleNavClick}
            onMouseEnter={(e) => showTooltip('Settings', e.currentTarget)}
            onMouseLeave={hideTooltip}
            aria-label="Settings"
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
          </NavLink>
        )}
        <button
          onClick={() => {
            logout.mutate()
            handleNavClick()
          }}
          onMouseEnter={(e) => showTooltip('Log out', e.currentTarget)}
          onMouseLeave={hideTooltip}
          aria-label="Log out"
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

      {/* Fixed tooltip rendered outside overflow container */}
      <SidebarTooltip {...tooltip} />
    </aside>
  )
}
