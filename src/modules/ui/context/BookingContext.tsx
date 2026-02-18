import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { BookingState, Organization } from '@/types'

interface BookingContextType {
  organization: Organization
  bookingState: BookingState
  updateBookingState: (updates: Partial<BookingState>) => void
  resetBookingState: () => void
}

const initialBookingState: BookingState = {
  organizationId: '',
  isNewClient: true,
  selectedPets: [],
}

const STORAGE_KEY = 'booking-state'

const BookingContext = createContext<BookingContextType | null>(null)

export function BookingProvider({
  children,
  organization,
}: {
  children: ReactNode
  organization: Organization
}) {
  const [bookingState, setBookingState] = useState<BookingState>(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Validate expected shape before trusting parsed data
        if (
          parsed &&
          typeof parsed === 'object' &&
          typeof parsed.isNewClient === 'boolean' &&
          Array.isArray(parsed.selectedPets) &&
          (parsed.step === undefined || typeof parsed.step === 'number') &&
          (parsed.clientInfo === undefined || (typeof parsed.clientInfo === 'object' && parsed.clientInfo !== null)) &&
          // Ensure the saved state belongs to this organization
          (parsed.organizationId === undefined || parsed.organizationId === organization.id)
        ) {
          // Force organizationId to current org
          return { ...parsed, organizationId: organization.id }
        }
        // Validation failed — discard saved state
        sessionStorage.removeItem(STORAGE_KEY)
      } catch {
        sessionStorage.removeItem(STORAGE_KEY)
      }
    }
    return {
      ...initialBookingState,
      organizationId: organization.id,
    }
  })

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(bookingState))
  }, [bookingState])

  const updateBookingState = (updates: Partial<BookingState>) => {
    setBookingState((prev) => ({ ...prev, ...updates }))
  }

  const resetBookingState = () => {
    sessionStorage.removeItem(STORAGE_KEY)
    setBookingState({
      ...initialBookingState,
      organizationId: organization.id,
    })
  }

  return (
    <BookingContext.Provider
      value={{
        organization,
        bookingState,
        updateBookingState,
        resetBookingState,
      }}
    >
      {children}
    </BookingContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBookingContext() {
  const context = useContext(BookingContext)
  if (!context) {
    throw new Error('useBookingContext must be used within a BookingProvider')
  }
  return context
}
