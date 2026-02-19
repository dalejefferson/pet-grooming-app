import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { useTheme } from './ThemeContext'

const SHORTCUT_TIPS = [
  { keys: 'S', description: 'Collapse or expand the sidebar' },
  { keys: 'C', description: 'Go to calendar' },
  { keys: 'Tab', description: 'Cycle calendar views (on Calendar page)' },
  { keys: 'A', description: 'Quickly book a new appointment' },
  { keys: 'T', description: 'Cycle through color themes' },
  { keys: 'R', description: 'Cycle report date ranges' },
  { keys: 'D', description: 'Cycle dashboard issue ranges' },
  { keys: 'Shift + ↑', description: 'Navigate up in the sidebar menu' },
  { keys: 'Shift + ↓', description: 'Navigate down in the sidebar menu' },
]

interface ShortcutTipsContextType {
  dismissTip: () => void
}

const ShortcutTipsContext = createContext<ShortcutTipsContextType | null>(null)

export function ShortcutTipsProvider({ children }: { children: ReactNode }) {
  const { colors } = useTheme()
  const location = useLocation()
  const [currentTip, setCurrentTip] = useState<typeof SHORTCUT_TIPS[0] | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Only show tips on admin app routes (not booking, landing, or login)
  const isAppRoute = location.pathname.startsWith('/app')

  const getRandomTip = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * SHORTCUT_TIPS.length)
    return SHORTCUT_TIPS[randomIndex]
  }, [])

  const dismissTip = useCallback(() => {
    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current)
      dismissTimeoutRef.current = null
    }
    setIsVisible(false)
    setTimeout(() => setCurrentTip(null), 300)
  }, [])

  const showTip = useCallback(() => {
    const tip = getRandomTip()
    setCurrentTip(tip)
    setIsVisible(true)

    // Auto-dismiss after 5 seconds
    dismissTimeoutRef.current = setTimeout(() => {
      dismissTip()
    }, 5000)
  }, [getRandomTip, dismissTip])

  // Dismiss any visible tip when navigating away from app routes
  useEffect(() => {
    if (!isAppRoute && currentTip) {
      dismissTip()
    }
  }, [isAppRoute, currentTip, dismissTip])

  useEffect(() => {
    // Don't schedule tips outside admin app routes
    if (!isAppRoute) return

    const scheduleNextTip = () => {
      // Random interval between 60-90 seconds
      const delay = Math.floor(Math.random() * 30000) + 60000
      intervalRef.current = setTimeout(() => {
        showTip()
        scheduleNextTip()
      }, delay)
    }

    scheduleNextTip()

    return () => {
      if (intervalRef.current) clearTimeout(intervalRef.current)
      if (dismissTimeoutRef.current) clearTimeout(dismissTimeoutRef.current)
    }
  }, [showTip, isAppRoute])

  return (
    <ShortcutTipsContext.Provider value={{ dismissTip }}>
      {children}
      {/* Shortcut Tips Toast */}
      {currentTip && (
        <div
          className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
            isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
          }`}
        >
          <div
            className="flex flex-col gap-2 rounded-xl border-2 border-[#1e293b] px-4 py-3 shadow-[3px_3px_0px_0px_#1e293b] min-w-[280px]"
            style={{ backgroundColor: colors.accentColor }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4" style={{ color: `var(--text-on-primary)` }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: `var(--text-on-primary)` }}>Quick Tip</span>
              </div>
              <button
                onClick={dismissTip}
                className="transition-colors opacity-60 hover:opacity-100"
                style={{ color: `var(--text-on-primary)` }}
                aria-label="Dismiss"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="inline-flex items-center rounded-lg border-2 border-[#1e293b] bg-white px-2 py-1 text-sm font-semibold text-[#1e293b] shadow-[1px_1px_0px_0px_#1e293b]"
              >
                {currentTip.keys}
              </span>
              <span className="text-sm" style={{ color: `var(--text-on-primary)` }}>{currentTip.description}</span>
            </div>
          </div>
        </div>
      )}
    </ShortcutTipsContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useShortcutTips() {
  const context = useContext(ShortcutTipsContext)
  if (!context) {
    throw new Error('useShortcutTips must be used within ShortcutTipsProvider')
  }
  return context
}
