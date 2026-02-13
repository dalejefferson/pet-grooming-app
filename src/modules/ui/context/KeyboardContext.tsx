import { createContext, useContext, useCallback, useEffect, useRef, type ReactNode } from 'react'

interface KeyboardContextType {
  // Functions to register callbacks from components
  registerSidebarToggle: (toggle: () => void) => void
  registerCalendarNavigate: (navigate: () => void) => void
  registerCalendarViewCycle: (cycle: (() => void) | null) => void
  registerBookAppointment: (open: () => void) => void
  registerSidebarNavigate: (navigate: (direction: 'up' | 'down') => void) => void
  registerThemeCycle: (cycle: () => void) => void
  registerReportCycle: (cycle: () => void) => void
  registerDashboardCycle: (cycle: () => void) => void
}

const KeyboardContext = createContext<KeyboardContextType | null>(null)

export function KeyboardProvider({ children }: { children: ReactNode }) {
  // Store callbacks from different parts of the app
  const sidebarToggleRef = useRef<(() => void) | null>(null)
  const calendarNavigateRef = useRef<(() => void) | null>(null)
  const calendarViewCycleRef = useRef<(() => void) | null>(null)
  const bookAppointmentRef = useRef<(() => void) | null>(null)
  const sidebarNavigateRef = useRef<((direction: 'up' | 'down') => void) | null>(null)
  const themeCycleRef = useRef<(() => void) | null>(null)
  const reportCycleRef = useRef<(() => void) | null>(null)
  const dashboardCycleRef = useRef<(() => void) | null>(null)

  const registerSidebarToggle = useCallback((toggle: () => void) => {
    sidebarToggleRef.current = toggle
  }, [])

  const registerCalendarNavigate = useCallback((nav: () => void) => {
    calendarNavigateRef.current = nav
  }, [])

  const registerCalendarViewCycle = useCallback((cycle: (() => void) | null) => {
    calendarViewCycleRef.current = cycle
  }, [])

  const registerBookAppointment = useCallback((open: () => void) => {
    bookAppointmentRef.current = open
  }, [])

  const registerSidebarNavigate = useCallback((navigate: (direction: 'up' | 'down') => void) => {
    sidebarNavigateRef.current = navigate
  }, [])

  const registerThemeCycle = useCallback((cycle: () => void) => {
    themeCycleRef.current = cycle
  }, [])

  const registerReportCycle = useCallback((cycle: () => void) => {
    reportCycleRef.current = cycle
  }, [])

  const registerDashboardCycle = useCallback((cycle: () => void) => {
    dashboardCycleRef.current = cycle
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      // S: Toggle sidebar
      if (!e.shiftKey && !e.metaKey && !e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault()
        sidebarToggleRef.current?.()
      }

      // C: Go to calendar
      if (!e.shiftKey && !e.metaKey && !e.ctrlKey && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        calendarNavigateRef.current?.()
      }

      // Tab: Cycle calendar views (on calendar page)
      if (e.key === 'Tab' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        if (calendarViewCycleRef.current) {
          e.preventDefault()
          calendarViewCycleRef.current()
        }
      }

      // A: Book appointment
      if (!e.shiftKey && !e.metaKey && !e.ctrlKey && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        bookAppointmentRef.current?.()
      }

      // Shift + ArrowUp: Navigate sidebar up
      if (e.shiftKey && !e.metaKey && !e.ctrlKey && e.key === 'ArrowUp') {
        e.preventDefault()
        sidebarNavigateRef.current?.('up')
      }

      // Shift + ArrowDown: Navigate sidebar down
      if (e.shiftKey && !e.metaKey && !e.ctrlKey && e.key === 'ArrowDown') {
        e.preventDefault()
        sidebarNavigateRef.current?.('down')
      }

      // T: Cycle through color themes
      if (!e.shiftKey && !e.metaKey && !e.ctrlKey && e.key.toLowerCase() === 't') {
        e.preventDefault()
        themeCycleRef.current?.()
      }

      // R: Cycle report date ranges
      if (!e.shiftKey && !e.metaKey && !e.ctrlKey && e.key.toLowerCase() === 'r') {
        e.preventDefault()
        reportCycleRef.current?.()
      }

      // D: Cycle dashboard issue ranges
      if (!e.shiftKey && !e.metaKey && !e.ctrlKey && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        dashboardCycleRef.current?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <KeyboardContext.Provider value={{ registerSidebarToggle, registerCalendarNavigate, registerCalendarViewCycle, registerBookAppointment, registerSidebarNavigate, registerThemeCycle, registerReportCycle, registerDashboardCycle }}>
      {children}
    </KeyboardContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useKeyboardShortcuts() {
  const context = useContext(KeyboardContext)
  if (!context) {
    throw new Error('useKeyboardShortcuts must be used within KeyboardProvider')
  }
  return context
}
