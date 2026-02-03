import type {
  VaccinationReminder,
  VaccinationReminderSettings,
  VaccinationStatus,
  Pet,
  Client,
} from '../types'
import { supabase } from '@/lib/supabase/client'
import {
  mapVaccinationReminderSettings,
  toDbVaccinationReminderSettings,
  mapVaccinationReminder,
  toDbVaccinationReminder,
  mapPet,
  mapVaccinationRecord,
  mapClient,
} from '../types/supabase-mappers'
import {
  getVaccinationStatus,
  getPetVaccinationStatus,
  canBookPet,
  getDaysUntilExpiration,
} from '@/lib/utils/vaccinationUtils'

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
// Internal helpers
// ============================================

async function fetchPets(organizationId?: string): Promise<Pet[]> {
  let query = supabase.from('pets').select('*')
  if (organizationId) {
    query = query.eq('organization_id', organizationId)
  }

  const { data: petRows, error: petError } = await query
  if (petError) throw petError
  if (!petRows || petRows.length === 0) return []

  // Fetch vaccination records for all these pets
  const petIds = petRows.map((p: { id: string }) => p.id)
  const { data: vaxRows, error: vaxError } = await supabase
    .from('vaccination_records')
    .select('*')
    .in('pet_id', petIds)

  if (vaxError) throw vaxError

  // Group vaccinations by pet_id
  const vaxByPet: Record<string, ReturnType<typeof mapVaccinationRecord>[]> = {}
  for (const vr of vaxRows ?? []) {
    const pid = vr.pet_id as string
    if (!vaxByPet[pid]) vaxByPet[pid] = []
    vaxByPet[pid].push(mapVaccinationRecord(vr))
  }

  return petRows.map((row: Record<string, unknown>) => mapPet(row, vaxByPet[(row as { id: string }).id] ?? []))
}

async function fetchClients(): Promise<Client[]> {
  const { data, error } = await supabase.from('clients').select('*')
  if (error) throw error
  return (data ?? []).map((row: Record<string, unknown>) => mapClient(row))
}

// ============================================
// Vaccination Reminders API
// ============================================

export const vaccinationRemindersApi = {
  // ============================================
  // Settings CRUD
  // ============================================

  async getSettings(organizationId?: string): Promise<VaccinationReminderSettings | null> {
    if (!organizationId) {
      const { data, error } = await supabase
        .from('vaccination_reminder_settings')
        .select('*')
        .limit(1)
        .maybeSingle()

      if (error) throw error
      return data ? mapVaccinationReminderSettings(data) : null
    }

    const { data, error } = await supabase
      .from('vaccination_reminder_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .maybeSingle()

    if (error) throw error
    return data ? mapVaccinationReminderSettings(data) : null
  },

  async updateSettings(
    data: Partial<VaccinationReminderSettings>
  ): Promise<VaccinationReminderSettings> {
    const dbData = toDbVaccinationReminderSettings(data)

    const { data: row, error } = await supabase
      .from('vaccination_reminder_settings')
      .upsert(dbData, { onConflict: 'organization_id' })
      .select()
      .single()

    if (error) throw error
    return mapVaccinationReminderSettings(row)
  },

  // ============================================
  // Reminder CRUD
  // ============================================

  async getAllReminders(organizationId?: string): Promise<VaccinationReminder[]> {
    if (!organizationId) {
      const { data, error } = await supabase
        .from('vaccination_reminders')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data ?? []).map(mapVaccinationReminder)
    }

    // Filter by organization via pets
    const { data: petRows, error: petError } = await supabase
      .from('pets')
      .select('id')
      .eq('organization_id', organizationId)

    if (petError) throw petError
    const orgPetIds = (petRows ?? []).map((p: { id: string }) => p.id)

    if (orgPetIds.length === 0) return []

    const { data, error } = await supabase
      .from('vaccination_reminders')
      .select('*')
      .in('pet_id', orgPetIds)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []).map(mapVaccinationReminder)
  },

  async getReminderById(id: string): Promise<VaccinationReminder | null> {
    const { data, error } = await supabase
      .from('vaccination_reminders')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data ? mapVaccinationReminder(data) : null
  },

  async getRemindersByPetId(petId: string): Promise<VaccinationReminder[]> {
    const { data, error } = await supabase
      .from('vaccination_reminders')
      .select('*')
      .eq('pet_id', petId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []).map(mapVaccinationReminder)
  },

  async getRemindersByClientId(clientId: string): Promise<VaccinationReminder[]> {
    const { data, error } = await supabase
      .from('vaccination_reminders')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data ?? []).map(mapVaccinationReminder)
  },

  async createReminder(
    data: Omit<VaccinationReminder, 'id' | 'createdAt'>
  ): Promise<VaccinationReminder> {
    const dbData = toDbVaccinationReminder(data)

    const { data: row, error } = await supabase
      .from('vaccination_reminders')
      .insert(dbData)
      .select()
      .single()

    if (error) throw error
    return mapVaccinationReminder(row)
  },

  async updateReminder(
    id: string,
    data: Partial<VaccinationReminder>
  ): Promise<VaccinationReminder> {
    const dbData = toDbVaccinationReminder(data)

    const { data: row, error } = await supabase
      .from('vaccination_reminders')
      .update(dbData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return mapVaccinationReminder(row)
  },

  async deleteReminder(id: string): Promise<void> {
    const { error } = await supabase
      .from('vaccination_reminders')
      .delete()
      .eq('id', id)

    if (error) throw error
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
    const pets = await fetchPets(organizationId)
    const clients = await fetchClients()

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
    // Fetch the pet with vaccinations
    const { data: petRow, error: petError } = await supabase
      .from('pets')
      .select('*')
      .eq('id', petId)
      .maybeSingle()

    if (petError) throw petError
    if (!petRow) {
      return {
        canBook: false,
        reason: 'Pet not found',
      }
    }

    // Fetch vaccination records for the pet
    const { data: vaxRows, error: vaxError } = await supabase
      .from('vaccination_records')
      .select('*')
      .eq('pet_id', petId)

    if (vaxError) throw vaxError

    const vaccinations = (vaxRows ?? []).map(mapVaccinationRecord)
    const pet = mapPet(petRow, vaccinations)

    const settings = await this.getSettings()
    const blockOnExpired = settings?.blockBookingOnExpired ?? false
    const result = canBookPet(pet, blockOnExpired)

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
    const { data, error } = await supabase
      .from('vaccination_reminders')
      .select('*')
      .eq('status', 'pending')

    if (error) throw error
    return (data ?? []).map(mapVaccinationReminder)
  },

  /**
   * Generate reminders for pets with expiring vaccinations
   * This would typically be called by a scheduled job
   */
  async generateReminders(organizationId?: string): Promise<VaccinationReminder[]> {
    const settings = await this.getSettings(organizationId)
    if (!settings || !settings.enabled) {
      return []
    }

    const expiringPets = await this.getExpiringVaccinations(
      Math.max(...settings.reminderDays),
      organizationId
    )

    const existingReminders = await this.getAllReminders(organizationId)
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

          const reminderData: Omit<VaccinationReminder, 'id' | 'createdAt'> = {
            petId: pet.id,
            clientId: pet.clientId,
            vaccinationId: vax.id,
            vaccinationName: vax.name,
            expirationDate: vax.expirationDate,
            reminderType,
            status: 'pending',
            channels,
          }

          const created = await this.createReminder(reminderData)
          newReminders.push(created)
        }
      }
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
