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
        return JSON.parse(saved)
      } catch {
        // ignore invalid data
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

export function useBookingContext() {
  const context = useContext(BookingContext)
  if (!context) {
    throw new Error('useBookingContext must be used within a BookingProvider')
  }
  return context
}
