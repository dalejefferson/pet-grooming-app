import { useState, useRef, useEffect } from 'react'
import { Menu, Bell, Palette, Check, Syringe, Calendar, Info } from 'lucide-react'
import { Button } from '../common'
import { useCurrentUser, useOrganization } from '@/hooks'
import {
  useNotifications,
  useUnreadNotificationCount,
  useMarkAllNotificationsRead,
} from '@/modules/notifications'
import { getInitials } from '@/lib/utils'
import { useTheme, type ThemeName, themeColors } from '@/modules/ui/context'
import { cn } from '@/lib/utils'
import type { InAppNotification } from '@/types'

interface HeaderProps {
  onMenuClick?: () => void
  title?: string
}

function NotificationIcon({ type }: { type: InAppNotification['type'] }) {
  switch (type) {
    case 'vaccination_expiring':
    case 'vaccination_expired':
      return <Syringe className="h-4 w-4 text-amber-600" />
    case 'appointment_reminder':
      return <Calendar className="h-4 w-4 text-blue-600" />
    default:
      return <Info className="h-4 w-4 text-gray-600" />
  }
}

function formatTimeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export function Header({ onMenuClick, title }: HeaderProps) {
  const { data: user } = useCurrentUser()
  const { data: org } = useOrganization()
  const { colors, currentTheme, setTheme } = useTheme()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { data: notifications = [] } = useNotifications()
  const { data: unreadCount = 0 } = useUnreadNotificationCount()
  const markAllRead = useMarkAllNotificationsRead()

  const themeNames = Object.keys(themeColors) as ThemeName[]

  const cycleTheme = () => {
    const currentIndex = themeNames.indexOf(currentTheme)
    const nextIndex = (currentIndex + 1) % themeNames.length
    setTheme(themeNames[nextIndex])
  }

  const handleBellClick = () => {
    setDropdownOpen((prev) => !prev)
  }

  const handleMarkAllRead = () => {
    markAllRead.mutate('org-1')
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

  // Get the 5 most recent notifications
  const recentNotifications = notifications.slice(0, 5)

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b-2 border-[#1e293b] bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Hamburger Menu Button - visible on mobile only */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuClick}
          className="lg:hidden min-h-[44px] min-w-[44px] p-2"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </Button>
        {title && <h1 className="text-base sm:text-lg font-bold text-[#1e293b] truncate">{title}</h1>}
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <span className="hidden text-sm text-[#64748b] md:block truncate max-w-[200px]">
          {org?.name}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={cycleTheme}
          className="relative min-h-[44px] min-w-[44px] p-2"
          aria-label="Change theme"
          title={`Current theme: ${currentTheme}`}
        >
          <Palette className="h-5 w-5" />
        </Button>

        {/* Notification Bell with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBellClick}
            className="relative min-h-[44px] min-w-[44px] p-2"
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full border border-white text-[10px] font-bold"
                style={{ backgroundColor: colors.accentColorDark, color: colors.textOnAccent }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div
              className={cn(
                'absolute right-0 top-full mt-2 w-80 rounded-xl border-2 border-[#1e293b] bg-white shadow-[4px_4px_0px_0px_#1e293b]',
                'animate-in fade-in slide-in-from-top-2 duration-200'
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#1e293b]/20 px-4 py-3">
                <h3 className="font-semibold text-[#1e293b]">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-sm text-[#64748b] hover:text-[#1e293b] transition-colors"
                  >
                    <Check className="h-4 w-4" />
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto">
                {recentNotifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-gray-500">
                    No notifications yet
                  </div>
                ) : (
                  recentNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        'flex gap-3 border-b border-gray-100 px-4 py-3 last:border-b-0',
                        !notification.read && 'bg-[#f0fdf4]'
                      )}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        <NotificationIcon type={notification.type} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1e293b] truncate">
                          {notification.title}
                        </p>
                        <p className="text-sm text-[#64748b] line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-xs text-[#94a3b8]">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div
                          className="h-2 w-2 flex-shrink-0 rounded-full mt-1.5"
                          style={{ backgroundColor: colors.accentColorDark }}
                        />
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {notifications.length > 5 && (
                <div className="border-t border-[#1e293b]/20 px-4 py-2">
                  <button
                    onClick={() => setDropdownOpen(false)}
                    className="w-full text-center text-sm font-medium hover:underline"
                    style={{ color: colors.accentColorDark }}
                  >
                    View all {notifications.length} notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {user && (
          <div
            className="flex h-10 w-10 sm:h-8 sm:w-8 items-center justify-center rounded-xl border-2 border-[#1e293b] text-sm font-medium shadow-[2px_2px_0px_0px_#1e293b]"
            style={{ backgroundColor: colors.accentColor, color: colors.textOnPrimary }}
          >
            {getInitials(user.name)}
          </div>
        )}
      </div>
    </header>
  )
}
