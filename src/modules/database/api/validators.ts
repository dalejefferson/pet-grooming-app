import type { BookingPolicies, Pet, Appointment } from '../types'
import { differenceInHours, differenceInDays, parseISO, isPast } from 'date-fns'

export class BookingValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BookingValidationError'
  }
}

export function validateMaxPetsPerAppointment(
  petCount: number,
  policies: BookingPolicies
): void {
  if (petCount > policies.maxPetsPerAppointment) {
    throw new BookingValidationError(
      `Maximum ${policies.maxPetsPerAppointment} pets per appointment`
    )
  }
}

export function validateAdvanceBooking(
  appointmentTime: string,
  policies: BookingPolicies
): void {
  const now = new Date()
  const appointmentDate = parseISO(appointmentTime)
  const hoursUntil = differenceInHours(appointmentDate, now)
  const daysUntil = differenceInDays(appointmentDate, now)

  if (hoursUntil < policies.minAdvanceBookingHours) {
    throw new BookingValidationError(
      `Appointments must be booked at least ${policies.minAdvanceBookingHours} hours in advance`
    )
  }

  if (daysUntil > policies.maxAdvanceBookingDays) {
    throw new BookingValidationError(
      `Appointments cannot be booked more than ${policies.maxAdvanceBookingDays} days in advance`
    )
  }
}

export function validateCancellationWindow(
  appointment: Appointment,
  policies: BookingPolicies
): { canCancel: boolean; isLate: boolean; reason?: string } {
  if (appointment.status === 'completed' || appointment.status === 'cancelled') {
    return { canCancel: false, isLate: false, reason: 'Appointment already finalized' }
  }

  const now = new Date()
  const appointmentTime = parseISO(appointment.startTime)
  const hoursUntil = differenceInHours(appointmentTime, now)

  if (isPast(appointmentTime)) {
    return { canCancel: false, isLate: false, reason: 'Cannot cancel past appointments' }
  }

  const isLate = hoursUntil < policies.cancellationWindowHours
  return { canCancel: true, isLate, reason: undefined }
}

export function validateVaccinationStatus(pets: Pet[]): {
  hasExpired: boolean
  expiredPets: string[]
} {
  const expiredPets: string[] = []

  for (const pet of pets) {
    for (const vax of pet.vaccinations) {
      const expDate = parseISO(vax.expirationDate)
      if (isPast(expDate)) {
        expiredPets.push(pet.name)
        break
      }
    }
  }

  return {
    hasExpired: expiredPets.length > 0,
    expiredPets,
  }
}

export function validateAppointmentDuration(
  totalDurationMinutes: number,
  maxMinutes: number = 480
): void {
  if (totalDurationMinutes > maxMinutes) {
    throw new BookingValidationError(
      `Appointment duration (${totalDurationMinutes} minutes) exceeds the maximum allowed duration of ${maxMinutes} minutes`
    )
  }
}

export function validatePetOwnership(
  pets: Pet[],
  clientId: string
): void {
  const wrongOwner = pets.find((p) => p.clientId !== clientId)
  if (wrongOwner) {
    throw new BookingValidationError(
      `Pet "${wrongOwner.name}" does not belong to this client`
    )
  }
}
