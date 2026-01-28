import { differenceInDays, parseISO, isBefore, startOfDay } from 'date-fns'
import type { VaccinationRecord, VaccinationStatus, Pet } from '@/types'

/**
 * Calculate the vaccination status based on expiration date
 */
export function getVaccinationStatus(expirationDate: string): VaccinationStatus {
  const today = startOfDay(new Date())
  const expDate = startOfDay(parseISO(expirationDate))
  const daysUntilExpiration = differenceInDays(expDate, today)

  if (daysUntilExpiration < 0) {
    return 'expired'
  } else if (daysUntilExpiration <= 7) {
    return 'expiring_7'
  } else if (daysUntilExpiration <= 30) {
    return 'expiring_30'
  } else {
    return 'valid'
  }
}

/**
 * Get days until expiration (negative if already expired)
 */
export function getDaysUntilExpiration(expirationDate: string): number {
  const today = startOfDay(new Date())
  const expDate = startOfDay(parseISO(expirationDate))
  return differenceInDays(expDate, today)
}

/**
 * Check if a vaccination is expired
 */
export function isVaccinationExpired(expirationDate: string): boolean {
  const today = startOfDay(new Date())
  const expDate = startOfDay(parseISO(expirationDate))
  return isBefore(expDate, today)
}

/**
 * Check if a vaccination is expiring within a specified number of days
 */
export function isVaccinationExpiringSoon(expirationDate: string, withinDays: number = 30): boolean {
  const today = startOfDay(new Date())
  const expDate = startOfDay(parseISO(expirationDate))
  const daysUntil = differenceInDays(expDate, today)
  return daysUntil >= 0 && daysUntil <= withinDays
}

/**
 * Get the most critical vaccination status for a pet
 * Returns the worst status among all vaccinations
 */
export function getPetVaccinationStatus(pet: Pet): VaccinationStatus {
  if (!pet.vaccinations || pet.vaccinations.length === 0) {
    return 'valid' // No vaccinations to track
  }

  let worstStatus: VaccinationStatus = 'valid'
  const statusPriority: Record<VaccinationStatus, number> = {
    expired: 3,
    expiring_7: 2,
    expiring_30: 1,
    valid: 0,
  }

  for (const vax of pet.vaccinations) {
    const status = getVaccinationStatus(vax.expirationDate)
    if (statusPriority[status] > statusPriority[worstStatus]) {
      worstStatus = status
    }
  }

  return worstStatus
}

/**
 * Get all expired vaccinations for a pet
 */
export function getExpiredVaccinations(pet: Pet): VaccinationRecord[] {
  if (!pet.vaccinations) return []
  return pet.vaccinations.filter(vax => isVaccinationExpired(vax.expirationDate))
}

/**
 * Get all vaccinations expiring within specified days for a pet
 */
export function getExpiringVaccinations(pet: Pet, withinDays: number = 30): VaccinationRecord[] {
  if (!pet.vaccinations) return []
  return pet.vaccinations.filter(vax => {
    const status = getVaccinationStatus(vax.expirationDate)
    if (withinDays <= 7) {
      return status === 'expiring_7'
    }
    return status === 'expiring_7' || status === 'expiring_30'
  })
}

/**
 * Check if a pet can be booked based on vaccination status
 */
export function canBookPet(pet: Pet, blockOnExpired: boolean = true): { canBook: boolean; reason?: string } {
  if (!blockOnExpired) {
    return { canBook: true }
  }

  const expiredVaccinations = getExpiredVaccinations(pet)
  if (expiredVaccinations.length > 0) {
    const names = expiredVaccinations.map(v => v.name).join(', ')
    return {
      canBook: false,
      reason: `${pet.name} has expired vaccinations: ${names}. Please update vaccination records before booking.`,
    }
  }

  return { canBook: true }
}

/**
 * Format days until expiration as a human-readable string
 */
export function formatDaysUntilExpiration(expirationDate: string): string {
  const days = getDaysUntilExpiration(expirationDate)

  if (days < 0) {
    const absDays = Math.abs(days)
    return absDays === 1 ? 'Expired yesterday' : `Expired ${absDays} days ago`
  } else if (days === 0) {
    return 'Expires today'
  } else if (days === 1) {
    return 'Expires tomorrow'
  } else if (days <= 7) {
    return `Expires in ${days} days`
  } else if (days <= 30) {
    return `Expires in ${days} days`
  } else {
    return `Valid for ${days} days`
  }
}

/**
 * Get color classes for vaccination status badge
 */
export function getVaccinationStatusColor(status: VaccinationStatus): string {
  switch (status) {
    case 'expired':
      return 'bg-red-100 text-red-800 border-red-300'
    case 'expiring_7':
      return 'bg-orange-100 text-orange-800 border-orange-300'
    case 'expiring_30':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    case 'valid':
      return 'bg-green-100 text-green-800 border-green-300'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}

/**
 * Get label for vaccination status
 */
export function getVaccinationStatusLabel(status: VaccinationStatus): string {
  switch (status) {
    case 'expired':
      return 'Expired'
    case 'expiring_7':
      return 'Expiring Soon'
    case 'expiring_30':
      return 'Expiring'
    case 'valid':
      return 'Valid'
    default:
      return 'Unknown'
  }
}
