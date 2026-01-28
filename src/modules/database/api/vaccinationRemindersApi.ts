import type {
  VaccinationReminder,
  VaccinationReminderSettings,
  VaccinationStatus,
  Pet,
  Client,
} from '../types'
import { getFromStorage, setToStorage, delay, generateId } from '../storage/localStorage'
import { seedVaccinationReminderSettings, seedPets, seedClients } from '../seed/seed'
import {
  getVaccinationStatus,
  getPetVaccinationStatus,
  canBookPet,
  getDaysUntilExpiration,
} from '@/lib/utils/vaccinationUtils'

const SETTINGS_KEY = 'vaccination_reminder_settings'
const REMINDERS_KEY = 'vaccination_reminders'
const PETS_KEY = 'pets'
const CLIENTS_KEY = 'clients'

// ============================================
// Internal helpers
// ============================================

function getSettings(): VaccinationReminderSettings {
  return getFromStorage<VaccinationReminderSettings>(
    SETTINGS_KEY,
    seedVaccinationReminderSettings
  )
}

function saveSettings(settings: VaccinationReminderSettings): void {
  setToStorage(SETTINGS_KEY, settings)
}

function getReminders(): VaccinationReminder[] {
  return getFromStorage<VaccinationReminder[]>(REMINDERS_KEY, [])
}

function saveReminders(reminders: VaccinationReminder[]): void {
  setToStorage(REMINDERS_KEY, reminders)
}

function getPets(): Pet[] {
  return getFromStorage<Pet[]>(PETS_KEY, seedPets)
}

function getClients(): Client[] {
  return getFromStorage<Client[]>(CLIENTS_KEY, seedClients)
}

// ============================================
// Types for API responses
// ============================================

export interface PetWithExpiringVaccinations {
  pet: Pet
  client: Client | null
  vaccinations: Array<{
    id: string
    name: string
    expirationDate: string
    status: VaccinationStatus
    daysUntilExpiration: number
  }>
  overallStatus: VaccinationStatus
}

export interface BookingEligibility {
  canBook: boolean
  reason?: string
  expiredVaccinations?: Array<{
    name: string
    expirationDate: string
    daysExpired: number
  }>
}

// ============================================
// Vaccination Reminders API
// ============================================

export const vaccinationRemindersApi = {
  // ============================================
  // Settings CRUD
  // ============================================

  async getSettings(organizationId?: string): Promise<VaccinationReminderSettings> {
    await delay()
    const settings = getSettings()
    // For MVP, we only have one organization
    if (organizationId && settings.organizationId !== organizationId) {
      return seedVaccinationReminderSettings
    }
    return settings
  },

  async updateSettings(
    data: Partial<VaccinationReminderSettings>
  ): Promise<VaccinationReminderSettings> {
    await delay()
    const settings = getSettings()
    const updated: VaccinationReminderSettings = {
      ...settings,
      ...data,
      updatedAt: new Date().toISOString(),
    }
    saveSettings(updated)
    return updated
  },

  // ============================================
  // Reminder CRUD
  // ============================================

  async getAllReminders(organizationId?: string): Promise<VaccinationReminder[]> {
    await delay()
    const reminders = getReminders()
    if (!organizationId) return reminders

    // Filter by organization via pets
    const pets = getPets()
    const orgPetIds = pets
      .filter((p) => p.organizationId === organizationId)
      .map((p) => p.id)

    return reminders.filter((r) => orgPetIds.includes(r.petId))
  },

  async getReminderById(id: string): Promise<VaccinationReminder | null> {
    await delay()
    const reminders = getReminders()
    return reminders.find((r) => r.id === id) ?? null
  },

  async getRemindersByPetId(petId: string): Promise<VaccinationReminder[]> {
    await delay()
    const reminders = getReminders()
    return reminders.filter((r) => r.petId === petId)
  },

  async getRemindersByClientId(clientId: string): Promise<VaccinationReminder[]> {
    await delay()
    const reminders = getReminders()
    return reminders.filter((r) => r.clientId === clientId)
  },

  async createReminder(
    data: Omit<VaccinationReminder, 'id' | 'createdAt'>
  ): Promise<VaccinationReminder> {
    await delay()
    const reminders = getReminders()
    const now = new Date().toISOString()
    const newReminder: VaccinationReminder = {
      ...data,
      id: generateId(),
      createdAt: now,
    }
    reminders.push(newReminder)
    saveReminders(reminders)
    return newReminder
  },

  async updateReminder(
    id: string,
    data: Partial<VaccinationReminder>
  ): Promise<VaccinationReminder> {
    await delay()
    const reminders = getReminders()
    const index = reminders.findIndex((r) => r.id === id)
    if (index === -1) {
      throw new Error('Vaccination reminder not found')
    }
    reminders[index] = {
      ...reminders[index],
      ...data,
    }
    saveReminders(reminders)
    return reminders[index]
  },

  async deleteReminder(id: string): Promise<void> {
    await delay()
    const reminders = getReminders()
    const filtered = reminders.filter((r) => r.id !== id)
    saveReminders(filtered)
  },

  async dismissReminder(id: string): Promise<VaccinationReminder> {
    return this.updateReminder(id, { status: 'dismissed' })
  },

  async markReminderSent(id: string): Promise<VaccinationReminder> {
    return this.updateReminder(id, {
      status: 'sent',
      sentAt: new Date().toISOString(),
    })
  },

  // ============================================
  // Business Logic
  // ============================================

  /**
   * Get pets with vaccinations expiring within the specified number of days
   * Returns pets with expired or expiring vaccinations, sorted by urgency
   */
  async getExpiringVaccinations(
    daysAhead: number = 30,
    organizationId?: string
  ): Promise<PetWithExpiringVaccinations[]> {
    await delay()

    let pets = getPets()
    const clients = getClients()

    if (organizationId) {
      pets = pets.filter((p) => p.organizationId === organizationId)
    }

    const results: PetWithExpiringVaccinations[] = []

    for (const pet of pets) {
      if (!pet.vaccinations || pet.vaccinations.length === 0) {
        continue
      }

      const expiringVaccinations = pet.vaccinations
        .map((vax) => {
          const status = getVaccinationStatus(vax.expirationDate)
          const daysUntil = getDaysUntilExpiration(vax.expirationDate)
          return {
            id: vax.id,
            name: vax.name,
            expirationDate: vax.expirationDate,
            status,
            daysUntilExpiration: daysUntil,
          }
        })
        .filter((vax) => {
          // Include if expired or expiring within daysAhead
          return vax.daysUntilExpiration <= daysAhead
        })

      if (expiringVaccinations.length > 0) {
        const client = clients.find((c) => c.id === pet.clientId) ?? null
        const overallStatus = getPetVaccinationStatus(pet)

        results.push({
          pet,
          client,
          vaccinations: expiringVaccinations,
          overallStatus,
        })
      }
    }

    // Sort by urgency: expired first, then by days until expiration
    const statusPriority: Record<VaccinationStatus, number> = {
      expired: 0,
      expiring_7: 1,
      expiring_30: 2,
      valid: 3,
    }

    results.sort((a, b) => {
      const priorityDiff = statusPriority[a.overallStatus] - statusPriority[b.overallStatus]
      if (priorityDiff !== 0) return priorityDiff

      // If same status, sort by soonest expiration
      const aMinDays = Math.min(...a.vaccinations.map((v) => v.daysUntilExpiration))
      const bMinDays = Math.min(...b.vaccinations.map((v) => v.daysUntilExpiration))
      return aMinDays - bMinDays
    })

    return results
  },

  /**
   * Check if a pet can be booked based on vaccination status
   * Returns eligibility status and reason if blocked
   */
  async checkBookingEligibility(petId: string): Promise<BookingEligibility> {
    await delay()

    const pets = getPets()
    const pet = pets.find((p) => p.id === petId)

    if (!pet) {
      return {
        canBook: false,
        reason: 'Pet not found',
      }
    }

    const settings = getSettings()
    const result = canBookPet(pet, settings.blockBookingOnExpired)

    if (!result.canBook) {
      // Get details about expired vaccinations
      const expiredVaccinations = pet.vaccinations
        .filter((vax) => getVaccinationStatus(vax.expirationDate) === 'expired')
        .map((vax) => ({
          name: vax.name,
          expirationDate: vax.expirationDate,
          daysExpired: Math.abs(getDaysUntilExpiration(vax.expirationDate)),
        }))

      return {
        canBook: false,
        reason: result.reason,
        expiredVaccinations,
      }
    }

    return { canBook: true }
  },

  /**
   * Get pending reminders that need to be sent
   * Useful for notification jobs
   */
  async getPendingReminders(): Promise<VaccinationReminder[]> {
    await delay()
    const reminders = getReminders()
    return reminders.filter((r) => r.status === 'pending')
  },

  /**
   * Generate reminders for pets with expiring vaccinations
   * This would typically be called by a scheduled job
   */
  async generateReminders(organizationId?: string): Promise<VaccinationReminder[]> {
    await delay()

    const settings = getSettings()
    if (!settings.enabled) {
      return []
    }

    const expiringPets = await this.getExpiringVaccinations(
      Math.max(...settings.reminderDays),
      organizationId
    )

    const existingReminders = getReminders()
    const newReminders: VaccinationReminder[] = []

    for (const { pet, vaccinations } of expiringPets) {
      for (const vax of vaccinations) {
        // Determine reminder type based on days until expiration
        let reminderType: VaccinationReminder['reminderType']
        if (vax.daysUntilExpiration < 0) {
          reminderType = 'expired'
        } else if (vax.daysUntilExpiration <= 7) {
          reminderType = '7_day'
        } else {
          reminderType = '30_day'
        }

        // Check if reminder already exists for this vaccination + type
        const exists = existingReminders.some(
          (r) =>
            r.petId === pet.id &&
            r.vaccinationId === vax.id &&
            r.reminderType === reminderType &&
            r.status !== 'dismissed'
        )

        if (!exists) {
          // Build channels array from settings
          const channels: VaccinationReminder['channels'] = []
          if (settings.channels.inApp) channels.push('in_app')
          if (settings.channels.email) channels.push('email')
          if (settings.channels.sms) channels.push('sms')

          const newReminder: VaccinationReminder = {
            id: generateId(),
            petId: pet.id,
            clientId: pet.clientId,
            vaccinationId: vax.id,
            vaccinationName: vax.name,
            expirationDate: vax.expirationDate,
            reminderType,
            status: 'pending',
            channels,
            createdAt: new Date().toISOString(),
          }

          newReminders.push(newReminder)
        }
      }
    }

    if (newReminders.length > 0) {
      const allReminders = [...existingReminders, ...newReminders]
      saveReminders(allReminders)
    }

    return newReminders
  },

  /**
   * Get summary statistics for vaccination reminders
   */
  async getStats(organizationId?: string): Promise<{
    totalExpired: number
    totalExpiring7Days: number
    totalExpiring30Days: number
    totalPendingReminders: number
    totalSentReminders: number
  }> {
    await delay()

    const [expiringPets, reminders] = await Promise.all([
      this.getExpiringVaccinations(30, organizationId),
      this.getAllReminders(organizationId),
    ])

    let totalExpired = 0
    let totalExpiring7Days = 0
    let totalExpiring30Days = 0

    for (const { vaccinations } of expiringPets) {
      for (const vax of vaccinations) {
        if (vax.status === 'expired') {
          totalExpired++
        } else if (vax.status === 'expiring_7') {
          totalExpiring7Days++
        } else if (vax.status === 'expiring_30') {
          totalExpiring30Days++
        }
      }
    }

    return {
      totalExpired,
      totalExpiring7Days,
      totalExpiring30Days,
      totalPendingReminders: reminders.filter((r) => r.status === 'pending').length,
      totalSentReminders: reminders.filter((r) => r.status === 'sent').length,
    }
  },
}
