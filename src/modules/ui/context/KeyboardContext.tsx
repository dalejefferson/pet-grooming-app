import { createContext, useContext, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

interface KeyboardContextType {
  // Functions to register callbacks from components
  registerSidebarToggle: (toggle: () => void) => void
  registerCalendarViewCycle: (cycle: () => void) => void
  registerBookAppointment: (open: () => void) => void
  registerSidebarNavigate: (navigate: (direction: 'up' | 'down') => void) => void
  registerThemeCycle: (cycle: () => void) => void
}

const KeyboardContext = createContext<KeyboardContextType | null>(null)

export function KeyboardProvider({ children }: { children: ReactNode }) {
  const location = useLocation()

  // Store callbacks from different parts of the app
  const sidebarToggleRef = useRef<(() => void) | null>(null)
  const calendarViewCycleRef = useRef<(() => void) | null>(null)
  const bookAppointmentRef = useRef<(() => void) | null>(null)
  const sidebarNavigateRef = useRef<((direction: 'up' | 'down') => void) | null>(null)
  const themeCycleRef = useRef<(() => void) | null>(null)

  const registerSidebarToggle = useCallback((toggle: () => void) => {
    sidebarToggleRef.current = toggle
  }, [])

  const registerCalendarViewCycle = useCallback((cycle: () => void) => {
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      // Shift + S: Toggle sidebar
      if (e.shiftKey && !e.metaKey && !e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault()
        sidebarToggleRef.current?.()
      }

      // Tab: Cycle calendar views (only on calendar page)
      if (e.key === 'Tab' && !e.shiftKey && !e.metaKey && !e.ctrlKey && location.pathname === '/app/calendar') {
        e.preventDefault()
        calendarViewCycleRef.current?.()
      }

      // Shift + A: Book appointment
      if (e.shiftKey && !e.metaKey && !e.ctrlKey && e.key.toLowerCase() === 'a') {
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

      // Shift + C: Cycle through color themes
      if (e.shiftKey && !e.metaKey && !e.ctrlKey && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        themeCycleRef.current?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [location.pathname])

  return (
    <KeyboardContext.Provider value={{ registerSidebarToggle, registerCalendarViewCycle, registerBookAppointment, registerSidebarNavigate, registerThemeCycle }}>
      {children}
    </KeyboardContext.Provider>
  )
}

export function useKeyboardShortcuts() {
  const context = useContext(KeyboardContext)
  if (!context) {
    throw new Error('useKeyboardShortcuts must be used within KeyboardProvider')
  }
  return context
}
