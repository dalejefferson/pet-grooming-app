import { describe, it, expect, vi, afterEach } from 'vitest'
import { addDays, subDays, format } from 'date-fns'
import {
  getVaccinationStatus,
  getDaysUntilExpiration,
  isVaccinationExpired,
  isVaccinationExpiringSoon,
  getPetVaccinationStatus,
  getExpiredVaccinations,
  getExpiringVaccinations,
  canBookPet,
  formatDaysUntilExpiration,
  getVaccinationStatusColor,
  getVaccinationStatusLabel,
} from './vaccinationUtils'
import type { Pet, VaccinationRecord } from '@/types'

// Helper to format dates as ISO strings (YYYY-MM-DD)
const toISO = (date: Date): string => format(date, 'yyyy-MM-dd')
const today = new Date()

// Helper to create a minimal Pet object for testing
function makePet(vaccinations: VaccinationRecord[]): Pet {
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
    behaviorLevel: 2 as Pet['behaviorLevel'],
    vaccinations,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }
}

// Helper to create a vaccination record
function makeVax(name: string, expirationDate: string): VaccinationRecord {
  return {
    id: `vax-${name}`,
    name,
    dateAdministered: '2024-01-01',
    expirationDate,
  }
}

describe('vaccinationUtils', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  describe('getVaccinationStatus', () => {
    it('should return expired for a past date', () => {
      const pastDate = toISO(subDays(today, 10))
      expect(getVaccinationStatus(pastDate)).toBe('expired')
    })

    it('should return expiring_7 for a date 5 days away', () => {
      const soonDate = toISO(addDays(today, 5))
      expect(getVaccinationStatus(soonDate)).toBe('expiring_7')
    })

    it('should return expiring_7 for a date exactly 7 days away', () => {
      const sevenDays = toISO(addDays(today, 7))
      expect(getVaccinationStatus(sevenDays)).toBe('expiring_7')
    })

    it('should return expiring_30 for a date 20 days away', () => {
      const twentyDays = toISO(addDays(today, 20))
      expect(getVaccinationStatus(twentyDays)).toBe('expiring_30')
    })

    it('should return expiring_30 for a date exactly 30 days away', () => {
      const thirtyDays = toISO(addDays(today, 30))
      expect(getVaccinationStatus(thirtyDays)).toBe('expiring_30')
    })

    it('should return valid for a date 60 days away', () => {
      const farDate = toISO(addDays(today, 60))
      expect(getVaccinationStatus(farDate)).toBe('valid')
    })

    it('should return expiring_7 for today (0 days away)', () => {
      const todayStr = toISO(today)
      expect(getVaccinationStatus(todayStr)).toBe('expiring_7')
    })

    it('should return expired for yesterday', () => {
      const yesterday = toISO(subDays(today, 1))
      expect(getVaccinationStatus(yesterday)).toBe('expired')
    })
  })

  describe('getDaysUntilExpiration', () => {
    it('should return 0 for today', () => {
      const todayStr = toISO(today)
      expect(getDaysUntilExpiration(todayStr)).toBe(0)
    })

    it('should return positive number for future dates', () => {
      const futureDate = toISO(addDays(today, 15))
      expect(getDaysUntilExpiration(futureDate)).toBe(15)
    })

    it('should return negative number for past dates', () => {
      const pastDate = toISO(subDays(today, 5))
      expect(getDaysUntilExpiration(pastDate)).toBe(-5)
    })

    it('should return correct value for exactly 1 day away', () => {
      const tomorrow = toISO(addDays(today, 1))
      expect(getDaysUntilExpiration(tomorrow)).toBe(1)
    })
  })

  describe('isVaccinationExpired', () => {
    it('should return true for a past expiration date', () => {
      const pastDate = toISO(subDays(today, 3))
      expect(isVaccinationExpired(pastDate)).toBe(true)
    })

    it('should return false for a future expiration date', () => {
      const futureDate = toISO(addDays(today, 10))
      expect(isVaccinationExpired(futureDate)).toBe(false)
    })

    it('should return false for today (not yet expired)', () => {
      const todayStr = toISO(today)
      expect(isVaccinationExpired(todayStr)).toBe(false)
    })
  })

  describe('isVaccinationExpiringSoon', () => {
    it('should return true for a date within 30 days (default)', () => {
      const soonDate = toISO(addDays(today, 15))
      expect(isVaccinationExpiringSoon(soonDate)).toBe(true)
    })

    it('should return false for a date beyond 30 days (default)', () => {
      const farDate = toISO(addDays(today, 45))
      expect(isVaccinationExpiringSoon(farDate)).toBe(false)
    })

    it('should return true for a date within custom window', () => {
      const soonDate = toISO(addDays(today, 5))
      expect(isVaccinationExpiringSoon(soonDate, 7)).toBe(true)
    })

    it('should return false for an expired date', () => {
      const pastDate = toISO(subDays(today, 5))
      expect(isVaccinationExpiringSoon(pastDate)).toBe(false)
    })

    it('should return true for today (within any window)', () => {
      const todayStr = toISO(today)
      expect(isVaccinationExpiringSoon(todayStr, 7)).toBe(true)
    })
  })

  describe('getPetVaccinationStatus', () => {
    it('should return valid for a pet with no vaccinations', () => {
      const pet = makePet([])
      expect(getPetVaccinationStatus(pet)).toBe('valid')
    })

    it('should return valid for a pet with undefined vaccinations', () => {
      const pet = makePet([])
      pet.vaccinations = undefined as unknown as VaccinationRecord[]
      expect(getPetVaccinationStatus(pet)).toBe('valid')
    })

    it('should return the status of a single vaccination', () => {
      const pet = makePet([makeVax('Rabies', toISO(addDays(today, 60)))])
      expect(getPetVaccinationStatus(pet)).toBe('valid')
    })

    it('should return the worst status among multiple vaccinations', () => {
      const pet = makePet([
        makeVax('Rabies', toISO(addDays(today, 60))),      // valid
        makeVax('DHPP', toISO(addDays(today, 5))),          // expiring_7
        makeVax('Bordetella', toISO(addDays(today, 20))),   // expiring_30
      ])
      expect(getPetVaccinationStatus(pet)).toBe('expiring_7')
    })

    it('should return expired when any vaccination is expired', () => {
      const pet = makePet([
        makeVax('Rabies', toISO(addDays(today, 60))),    // valid
        makeVax('DHPP', toISO(subDays(today, 5))),        // expired
      ])
      expect(getPetVaccinationStatus(pet)).toBe('expired')
    })
  })

  describe('getExpiredVaccinations', () => {
    it('should return empty array when no vaccinations are expired', () => {
      const pet = makePet([makeVax('Rabies', toISO(addDays(today, 60)))])
      expect(getExpiredVaccinations(pet)).toEqual([])
    })

    it('should return only expired vaccinations', () => {
      const expiredVax = makeVax('DHPP', toISO(subDays(today, 10)))
      const validVax = makeVax('Rabies', toISO(addDays(today, 60)))
      const pet = makePet([expiredVax, validVax])
      const result = getExpiredVaccinations(pet)
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('DHPP')
    })

    it('should return empty array when pet has no vaccinations', () => {
      const pet = makePet([])
      pet.vaccinations = undefined as unknown as VaccinationRecord[]
      expect(getExpiredVaccinations(pet)).toEqual([])
    })
  })

  describe('getExpiringVaccinations', () => {
    it('should return vaccinations expiring within 30 days by default', () => {
      const pet = makePet([
        makeVax('Rabies', toISO(addDays(today, 5))),      // expiring_7
        makeVax('DHPP', toISO(addDays(today, 20))),        // expiring_30
        makeVax('Bordetella', toISO(addDays(today, 60))),  // valid
      ])
      const result = getExpiringVaccinations(pet)
      expect(result).toHaveLength(2)
    })

    it('should return only expiring_7 vaccinations when withinDays is 7', () => {
      const pet = makePet([
        makeVax('Rabies', toISO(addDays(today, 5))),      // expiring_7
        makeVax('DHPP', toISO(addDays(today, 20))),        // expiring_30
      ])
      const result = getExpiringVaccinations(pet, 7)
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Rabies')
    })
  })

  describe('canBookPet', () => {
    it('should return canBook true when all vaccinations are valid', () => {
      const pet = makePet([makeVax('Rabies', toISO(addDays(today, 60)))])
      const result = canBookPet(pet)
      expect(result.canBook).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it('should return canBook false when any vaccination is expired', () => {
      const pet = makePet([makeVax('Rabies', toISO(subDays(today, 5)))])
      const result = canBookPet(pet)
      expect(result.canBook).toBe(false)
      expect(result.reason).toContain('expired vaccinations')
      expect(result.reason).toContain('Rabies')
      expect(result.reason).toContain('Buddy')
    })

    it('should return canBook true when vaccinations are expiring soon but not expired', () => {
      const pet = makePet([makeVax('DHPP', toISO(addDays(today, 3)))])
      const result = canBookPet(pet)
      expect(result.canBook).toBe(true)
    })

    it('should return canBook true when blockOnExpired is false even if expired', () => {
      const pet = makePet([makeVax('Rabies', toISO(subDays(today, 5)))])
      const result = canBookPet(pet, false)
      expect(result.canBook).toBe(true)
    })

    it('should include all expired vaccination names in the reason', () => {
      const pet = makePet([
        makeVax('Rabies', toISO(subDays(today, 5))),
        makeVax('DHPP', toISO(subDays(today, 10))),
      ])
      const result = canBookPet(pet)
      expect(result.canBook).toBe(false)
      expect(result.reason).toContain('Rabies')
      expect(result.reason).toContain('DHPP')
    })

    it('should return canBook true for a pet with no vaccinations', () => {
      const pet = makePet([])
      const result = canBookPet(pet)
      expect(result.canBook).toBe(true)
    })
  })

  describe('formatDaysUntilExpiration', () => {
    it('should return "Expires today" for today', () => {
      const todayStr = toISO(today)
      expect(formatDaysUntilExpiration(todayStr)).toBe('Expires today')
    })

    it('should return "Expires tomorrow" for 1 day away', () => {
      const tomorrow = toISO(addDays(today, 1))
      expect(formatDaysUntilExpiration(tomorrow)).toBe('Expires tomorrow')
    })

    it('should return "Expired yesterday" for 1 day ago', () => {
      const yesterday = toISO(subDays(today, 1))
      expect(formatDaysUntilExpiration(yesterday)).toBe('Expired yesterday')
    })

    it('should return "Expired N days ago" for past dates', () => {
      const pastDate = toISO(subDays(today, 10))
      expect(formatDaysUntilExpiration(pastDate)).toBe('Expired 10 days ago')
    })

    it('should return "Expires in N days" for dates within 30 days', () => {
      const soonDate = toISO(addDays(today, 5))
      expect(formatDaysUntilExpiration(soonDate)).toBe('Expires in 5 days')
    })

    it('should return "Valid for N days" for dates beyond 30 days', () => {
      const farDate = toISO(addDays(today, 60))
      expect(formatDaysUntilExpiration(farDate)).toBe('Valid for 60 days')
    })
  })

  describe('getVaccinationStatusColor', () => {
    it('should return red classes for expired', () => {
      expect(getVaccinationStatusColor('expired')).toContain('red')
    })

    it('should return orange classes for expiring_7', () => {
      expect(getVaccinationStatusColor('expiring_7')).toContain('orange')
    })

    it('should return yellow classes for expiring_30', () => {
      expect(getVaccinationStatusColor('expiring_30')).toContain('yellow')
    })

    it('should return green classes for valid', () => {
      expect(getVaccinationStatusColor('valid')).toContain('green')
    })
  })

  describe('getVaccinationStatusLabel', () => {
    it('should return correct labels for each status', () => {
      expect(getVaccinationStatusLabel('expired')).toBe('Expired')
      expect(getVaccinationStatusLabel('expiring_7')).toBe('Expiring Soon')
      expect(getVaccinationStatusLabel('expiring_30')).toBe('Expiring')
      expect(getVaccinationStatusLabel('valid')).toBe('Valid')
    })
  })
})
