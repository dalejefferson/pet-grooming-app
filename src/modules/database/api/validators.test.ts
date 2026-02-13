import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  BookingValidationError,
  validateMaxPetsPerAppointment,
  validateAdvanceBooking,
  validateCancellationWindow,
  validateVaccinationStatus,
  validateAppointmentDuration,
  validatePetOwnership,
} from './validators'
import type { BookingPolicies, Pet, Appointment } from '../types'

// ---------------------------------------------------------------------------
// Helpers — minimal objects that satisfy the type contracts
// ---------------------------------------------------------------------------

function makePolicies(overrides: Partial<BookingPolicies> = {}): BookingPolicies {
  return {
    id: 'pol-1',
    organizationId: 'org-1',
    newClientMode: 'auto_confirm',
    existingClientMode: 'auto_confirm',
    depositRequired: false,
    depositPercentage: 0,
    depositMinimum: 0,
    noShowFeePercentage: 0,
    cancellationWindowHours: 24,
    lateCancellationFeePercentage: 50,
    maxPetsPerAppointment: 3,
    minAdvanceBookingHours: 4,
    maxAdvanceBookingDays: 60,
    policyText: '',
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

function makePet(overrides: Partial<Pet> = {}): Pet {
  return {
    id: 'pet-1',
    clientId: 'client-1',
    organizationId: 'org-1',
    name: 'Buddy',
    species: 'dog',
    breed: 'Golden Retriever',
    weight: 30,
    weightRange: 'large',
    coatType: 'long',
    behaviorLevel: 2,
    vaccinations: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

function makeAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: 'appt-1',
    organizationId: 'org-1',
    clientId: 'client-1',
    pets: [],
    startTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48h from now
    endTime: new Date(Date.now() + 49 * 60 * 60 * 1000).toISOString(),
    status: 'confirmed',
    depositPaid: false,
    totalAmount: 100,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// validateMaxPetsPerAppointment
// ---------------------------------------------------------------------------

describe('validateMaxPetsPerAppointment', () => {
  const policies = makePolicies({ maxPetsPerAppointment: 3 })

  it('should pass when pet count is below the limit', () => {
    expect(() => validateMaxPetsPerAppointment(2, policies)).not.toThrow()
  })

  it('should pass when pet count is exactly at the limit', () => {
    expect(() => validateMaxPetsPerAppointment(3, policies)).not.toThrow()
  })

  it('should throw when pet count exceeds the limit', () => {
    expect(() => validateMaxPetsPerAppointment(4, policies)).toThrow(
      BookingValidationError
    )
    expect(() => validateMaxPetsPerAppointment(4, policies)).toThrow(
      'Maximum 3 pets per appointment'
    )
  })

  it('should pass when pet count is 0', () => {
    expect(() => validateMaxPetsPerAppointment(0, policies)).not.toThrow()
  })

  it('should respect a custom limit of 1', () => {
    const strict = makePolicies({ maxPetsPerAppointment: 1 })
    expect(() => validateMaxPetsPerAppointment(1, strict)).not.toThrow()
    expect(() => validateMaxPetsPerAppointment(2, strict)).toThrow(
      BookingValidationError
    )
  })
})

// ---------------------------------------------------------------------------
// validateAdvanceBooking
// ---------------------------------------------------------------------------

describe('validateAdvanceBooking', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  const policies = makePolicies({
    minAdvanceBookingHours: 4,
    maxAdvanceBookingDays: 60,
  })

  it('should pass when appointment is within the valid booking window', () => {
    // 2 days from now — well within window
    const time = '2026-06-17T12:00:00Z'
    expect(() => validateAdvanceBooking(time, policies)).not.toThrow()
  })

  it('should throw when appointment is too soon (under min hours)', () => {
    // 1 hour from now — violates 4-hour minimum
    const time = '2026-06-15T13:00:00Z'
    expect(() => validateAdvanceBooking(time, policies)).toThrow(
      BookingValidationError
    )
    expect(() => validateAdvanceBooking(time, policies)).toThrow(
      'at least 4 hours in advance'
    )
  })

  it('should pass when appointment is exactly at the min advance boundary', () => {
    // Exactly 4 hours from now
    const time = '2026-06-15T16:00:00Z'
    expect(() => validateAdvanceBooking(time, policies)).not.toThrow()
  })

  it('should throw when appointment is too far in the future', () => {
    // 90 days from now — exceeds 60-day max
    const time = '2026-09-13T12:00:00Z'
    expect(() => validateAdvanceBooking(time, policies)).toThrow(
      BookingValidationError
    )
    expect(() => validateAdvanceBooking(time, policies)).toThrow(
      'cannot be booked more than 60 days'
    )
  })

  it('should pass when appointment is exactly at the max advance boundary', () => {
    // Exactly 60 days from now
    const time = '2026-08-14T12:00:00Z'
    expect(() => validateAdvanceBooking(time, policies)).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// validateCancellationWindow
// ---------------------------------------------------------------------------

describe('validateCancellationWindow', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  const policies = makePolicies({ cancellationWindowHours: 24 })

  it('should allow cancellation when appointment is far enough in the future', () => {
    const appt = makeAppointment({
      status: 'confirmed',
      startTime: '2026-06-17T12:00:00Z', // 48h away
    })
    const result = validateCancellationWindow(appt, policies)
    expect(result.canCancel).toBe(true)
    expect(result.isLate).toBe(false)
    expect(result.reason).toBeUndefined()
  })

  it('should flag late cancellation when inside the cancellation window', () => {
    const appt = makeAppointment({
      status: 'confirmed',
      startTime: '2026-06-16T06:00:00Z', // 18h away — inside 24h window
    })
    const result = validateCancellationWindow(appt, policies)
    expect(result.canCancel).toBe(true)
    expect(result.isLate).toBe(true)
  })

  it('should not allow cancellation of completed appointments', () => {
    const appt = makeAppointment({
      status: 'completed',
      startTime: '2026-06-17T12:00:00Z',
    })
    const result = validateCancellationWindow(appt, policies)
    expect(result.canCancel).toBe(false)
    expect(result.reason).toBe('Appointment already finalized')
  })

  it('should not allow cancellation of already-cancelled appointments', () => {
    const appt = makeAppointment({
      status: 'cancelled',
      startTime: '2026-06-17T12:00:00Z',
    })
    const result = validateCancellationWindow(appt, policies)
    expect(result.canCancel).toBe(false)
    expect(result.reason).toBe('Appointment already finalized')
  })

  it('should not allow cancellation of past appointments', () => {
    const appt = makeAppointment({
      status: 'confirmed',
      startTime: '2026-06-14T12:00:00Z', // yesterday
    })
    const result = validateCancellationWindow(appt, policies)
    expect(result.canCancel).toBe(false)
    expect(result.reason).toBe('Cannot cancel past appointments')
  })
})

// ---------------------------------------------------------------------------
// validateVaccinationStatus
// ---------------------------------------------------------------------------

describe('validateVaccinationStatus', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'))
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return no expired pets when all vaccinations are current', () => {
    const pets = [
      makePet({
        name: 'Buddy',
        vaccinations: [
          { id: 'v1', name: 'Rabies', dateAdministered: '2026-01-01', expirationDate: '2027-01-01' },
        ],
      }),
    ]
    const result = validateVaccinationStatus(pets)
    expect(result.hasExpired).toBe(false)
    expect(result.expiredPets).toEqual([])
  })

  it('should detect expired vaccinations', () => {
    const pets = [
      makePet({
        name: 'Max',
        vaccinations: [
          { id: 'v1', name: 'Rabies', dateAdministered: '2024-01-01', expirationDate: '2025-01-01' },
        ],
      }),
    ]
    const result = validateVaccinationStatus(pets)
    expect(result.hasExpired).toBe(true)
    expect(result.expiredPets).toEqual(['Max'])
  })

  it('should list multiple pets with expired vaccinations', () => {
    const pets = [
      makePet({
        name: 'Max',
        vaccinations: [
          { id: 'v1', name: 'Rabies', dateAdministered: '2024-01-01', expirationDate: '2025-01-01' },
        ],
      }),
      makePet({
        name: 'Luna',
        vaccinations: [
          { id: 'v2', name: 'Bordetella', dateAdministered: '2024-06-01', expirationDate: '2025-06-01' },
        ],
      }),
    ]
    const result = validateVaccinationStatus(pets)
    expect(result.hasExpired).toBe(true)
    expect(result.expiredPets).toContain('Max')
    expect(result.expiredPets).toContain('Luna')
    expect(result.expiredPets).toHaveLength(2)
  })

  it('should return no expired pets when pets have no vaccinations', () => {
    const pets = [makePet({ vaccinations: [] })]
    const result = validateVaccinationStatus(pets)
    expect(result.hasExpired).toBe(false)
    expect(result.expiredPets).toEqual([])
  })

  it('should handle an empty pets array', () => {
    const result = validateVaccinationStatus([])
    expect(result.hasExpired).toBe(false)
    expect(result.expiredPets).toEqual([])
  })

  it('should only list a pet once even if multiple vaccinations are expired', () => {
    const pets = [
      makePet({
        name: 'Buddy',
        vaccinations: [
          { id: 'v1', name: 'Rabies', dateAdministered: '2024-01-01', expirationDate: '2025-01-01' },
          { id: 'v2', name: 'Bordetella', dateAdministered: '2024-01-01', expirationDate: '2025-06-01' },
        ],
      }),
    ]
    const result = validateVaccinationStatus(pets)
    expect(result.hasExpired).toBe(true)
    expect(result.expiredPets).toEqual(['Buddy'])
  })
})

// ---------------------------------------------------------------------------
// validateAppointmentDuration
// ---------------------------------------------------------------------------

describe('validateAppointmentDuration', () => {
  it('should pass when duration is under the default 480 minute limit', () => {
    expect(() => validateAppointmentDuration(120)).not.toThrow()
  })

  it('should pass when duration is exactly at the default limit', () => {
    expect(() => validateAppointmentDuration(480)).not.toThrow()
  })

  it('should throw when duration exceeds the default 480 minute limit', () => {
    expect(() => validateAppointmentDuration(481)).toThrow(BookingValidationError)
    expect(() => validateAppointmentDuration(481)).toThrow('481 minutes')
    expect(() => validateAppointmentDuration(481)).toThrow('480 minutes')
  })

  it('should respect a custom max duration', () => {
    expect(() => validateAppointmentDuration(200, 180)).toThrow(BookingValidationError)
    expect(() => validateAppointmentDuration(200, 180)).toThrow('180 minutes')
  })

  it('should pass when duration is within a custom max', () => {
    expect(() => validateAppointmentDuration(60, 120)).not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// validatePetOwnership
// ---------------------------------------------------------------------------

describe('validatePetOwnership', () => {
  it('should pass when all pets belong to the client', () => {
    const pets = [
      makePet({ clientId: 'client-1', name: 'Buddy' }),
      makePet({ clientId: 'client-1', name: 'Luna' }),
    ]
    expect(() => validatePetOwnership(pets, 'client-1')).not.toThrow()
  })

  it('should throw when a pet belongs to a different client', () => {
    const pets = [
      makePet({ clientId: 'client-1', name: 'Buddy' }),
      makePet({ clientId: 'client-2', name: 'Max' }),
    ]
    expect(() => validatePetOwnership(pets, 'client-1')).toThrow(
      BookingValidationError
    )
    expect(() => validatePetOwnership(pets, 'client-1')).toThrow(
      'Pet "Max" does not belong to this client'
    )
  })

  it('should pass with an empty pets array', () => {
    expect(() => validatePetOwnership([], 'client-1')).not.toThrow()
  })

  it('should throw naming the first wrong-owner pet found', () => {
    const pets = [
      makePet({ clientId: 'client-999', name: 'Rogue' }),
      makePet({ clientId: 'client-999', name: 'Also Rogue' }),
    ]
    expect(() => validatePetOwnership(pets, 'client-1')).toThrow(
      'Pet "Rogue" does not belong to this client'
    )
  })
})

// ---------------------------------------------------------------------------
// BookingValidationError
// ---------------------------------------------------------------------------

describe('BookingValidationError', () => {
  it('should have the correct name property', () => {
    const error = new BookingValidationError('test')
    expect(error.name).toBe('BookingValidationError')
  })

  it('should be an instance of Error', () => {
    const error = new BookingValidationError('test')
    expect(error).toBeInstanceOf(Error)
  })

  it('should carry the provided message', () => {
    const error = new BookingValidationError('something went wrong')
    expect(error.message).toBe('something went wrong')
  })
})
