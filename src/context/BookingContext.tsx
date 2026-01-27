import { createContext, useContext, useState, type ReactNode } from 'react'
import type { BookingState, Organization } from '@/types'

interface BookingContextType {
  organization: Organization | null
  bookingState: BookingState
  updateBookingState: (updates: Partial<BookingState>) => void
  resetBookingState: () => void
}

const initialBookingState: BookingState = {
  organizationId: '',
  isNewClient: true,
  selectedPets: [],
}

const BookingContext = createContext<BookingContextType | null>(null)

export function BookingProvider({
  children,
  organization,
}: {
  children: ReactNode
  organization: Organization
}) {
  const [bookingState, setBookingState] = useState<BookingState>({
    ...initialBookingState,
    organizationId: organization.id,
  })

  const updateBookingState = (updates: Partial<BookingState>) => {
    setBookingState((prev) => ({ ...prev, ...updates }))
  }

  const resetBookingState = () => {
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
