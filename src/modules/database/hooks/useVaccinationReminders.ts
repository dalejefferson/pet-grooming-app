import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  vaccinationRemindersApi,
  type PetWithExpiringVaccinations,
  type BookingEligibility,
} from '../api/vaccinationRemindersApi'
import type { VaccinationReminderSettings, VaccinationReminder } from '../types'

// ============================================
// Query Keys
// ============================================

export const vaccinationReminderKeys = {
  all: ['vaccinationReminders'] as const,
  settings: (orgId?: string) => [...vaccinationReminderKeys.all, 'settings', orgId] as const,
  reminders: (orgId?: string) => [...vaccinationReminderKeys.all, 'list', orgId] as const,
  remindersByPet: (petId: string) =>
    [...vaccinationReminderKeys.all, 'pet', petId] as const,
  remindersByClient: (clientId: string) =>
    [...vaccinationReminderKeys.all, 'client', clientId] as const,
  expiring: (daysAhead: number, orgId?: string) =>
    [...vaccinationReminderKeys.all, 'expiring', daysAhead, orgId] as const,
  eligibility: (petId: string) =>
    [...vaccinationReminderKeys.all, 'eligibility', petId] as const,
  stats: (orgId?: string) => [...vaccinationReminderKeys.all, 'stats', orgId] as const,
  pending: () => [...vaccinationReminderKeys.all, 'pending'] as const,
}

// ============================================
// Settings Hooks
// ============================================

/**
 * Hook to get vaccination reminder settings
 */
export function useVaccinationReminderSettings(organizationId?: string) {
  return useQuery({
    queryKey: vaccinationReminderKeys.settings(organizationId),
    queryFn: () => vaccinationRemindersApi.getSettings(organizationId),
  })
}

/**
 * Hook to update vaccination reminder settings
 */
export function useUpdateVaccinationReminderSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<VaccinationReminderSettings>) =>
      vaccinationRemindersApi.updateSettings(data),
    onSuccess: (updatedSettings) => {
      // Update the specific settings cache
      queryClient.setQueryData(
        vaccinationReminderKeys.settings(updatedSettings.organizationId),
        updatedSettings
      )
      // Invalidate all vaccination reminder queries since settings affect behavior
      queryClient.invalidateQueries({ queryKey: vaccinationReminderKeys.all })
    },
  })
}

// ============================================
// Reminder CRUD Hooks
// ============================================

/**
 * Hook to get all reminders
 */
export function useVaccinationReminders(organizationId?: string) {
  return useQuery({
    queryKey: vaccinationReminderKeys.reminders(organizationId),
    queryFn: () => vaccinationRemindersApi.getAllReminders(organizationId),
  })
}

/**
 * Hook to get reminders for a specific pet
 */
export function usePetVaccinationReminders(petId: string) {
  return useQuery({
    queryKey: vaccinationReminderKeys.remindersByPet(petId),
    queryFn: () => vaccinationRemindersApi.getRemindersByPetId(petId),
    enabled: !!petId,
  })
}

/**
 * Hook to get reminders for a specific client
 */
export function useClientVaccinationReminders(clientId: string) {
  return useQuery({
    queryKey: vaccinationReminderKeys.remindersByClient(clientId),
    queryFn: () => vaccinationRemindersApi.getRemindersByClientId(clientId),
    enabled: !!clientId,
  })
}

/**
 * Hook to create a new reminder
 */
export function useCreateVaccinationReminder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Omit<VaccinationReminder, 'id' | 'createdAt'>) =>
      vaccinationRemindersApi.createReminder(data),
    onSuccess: (newReminder) => {
      queryClient.invalidateQueries({
        queryKey: vaccinationReminderKeys.reminders(),
      })
      queryClient.invalidateQueries({
        queryKey: vaccinationReminderKeys.remindersByPet(newReminder.petId),
      })
      queryClient.invalidateQueries({
        queryKey: vaccinationReminderKeys.remindersByClient(newReminder.clientId),
      })
      queryClient.invalidateQueries({
        queryKey: vaccinationReminderKeys.stats(),
      })
    },
  })
}

/**
 * Hook to update a reminder
 */
export function useUpdateVaccinationReminder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VaccinationReminder> }) =>
      vaccinationRemindersApi.updateReminder(id, data),
    onSuccess: (updatedReminder) => {
      queryClient.invalidateQueries({
        queryKey: vaccinationReminderKeys.reminders(),
      })
      queryClient.invalidateQueries({
        queryKey: vaccinationReminderKeys.remindersByPet(updatedReminder.petId),
      })
      queryClient.invalidateQueries({
        queryKey: vaccinationReminderKeys.stats(),
      })
    },
  })
}

/**
 * Hook to delete a reminder
 */
export function useDeleteVaccinationReminder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => vaccinationRemindersApi.deleteReminder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vaccinationReminderKeys.all })
    },
  })
}

/**
 * Hook to dismiss a reminder
 */
export function useDismissReminder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => vaccinationRemindersApi.dismissReminder(id),
    onSuccess: (updatedReminder) => {
      queryClient.invalidateQueries({
        queryKey: vaccinationReminderKeys.reminders(),
      })
      queryClient.invalidateQueries({
        queryKey: vaccinationReminderKeys.remindersByPet(updatedReminder.petId),
      })
      queryClient.invalidateQueries({
        queryKey: vaccinationReminderKeys.stats(),
      })
      queryClient.invalidateQueries({
        queryKey: vaccinationReminderKeys.pending(),
      })
    },
  })
}

/**
 * Hook to mark a reminder as sent
 */
export function useMarkReminderSent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => vaccinationRemindersApi.markReminderSent(id),
    onSuccess: (updatedReminder) => {
      queryClient.invalidateQueries({
        queryKey: vaccinationReminderKeys.reminders(),
      })
      queryClient.invalidateQueries({
        queryKey: vaccinationReminderKeys.remindersByPet(updatedReminder.petId),
      })
      queryClient.invalidateQueries({
        queryKey: vaccinationReminderKeys.stats(),
      })
      queryClient.invalidateQueries({
        queryKey: vaccinationReminderKeys.pending(),
      })
    },
  })
}

// ============================================
// Business Logic Hooks
// ============================================

/**
 * Hook to get pets with expiring or expired vaccinations
 * @param daysAhead - Number of days to look ahead (default: 30)
 * @param organizationId - Optional organization filter
 */
export function useExpiringVaccinations(
  daysAhead: number = 30,
  organizationId?: string
) {
  return useQuery<PetWithExpiringVaccinations[]>({
    queryKey: vaccinationReminderKeys.expiring(daysAhead, organizationId),
    queryFn: () => vaccinationRemindersApi.getExpiringVaccinations(daysAhead, organizationId),
    // Refresh every 5 minutes since vaccination status is time-sensitive
    refetchInterval: 5 * 60 * 1000,
  })
}

/**
 * Hook to check if a pet can be booked based on vaccination status
 * @param petId - The pet ID to check
 */
export function useBookingEligibility(petId: string) {
  return useQuery<BookingEligibility>({
    queryKey: vaccinationReminderKeys.eligibility(petId),
    queryFn: () => vaccinationRemindersApi.checkBookingEligibility(petId),
    enabled: !!petId,
  })
}

/**
 * Hook to get pending reminders (for notification UI)
 */
export function usePendingReminders() {
  return useQuery({
    queryKey: vaccinationReminderKeys.pending(),
    queryFn: () => vaccinationRemindersApi.getPendingReminders(),
  })
}

/**
 * Hook to generate reminders for expiring vaccinations
 */
export function useGenerateReminders() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (organizationId?: string) =>
      vaccinationRemindersApi.generateReminders(organizationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: vaccinationReminderKeys.all })
    },
  })
}

/**
 * Hook to get vaccination reminder statistics
 */
export function useVaccinationReminderStats(organizationId?: string) {
  return useQuery({
    queryKey: vaccinationReminderKeys.stats(organizationId),
    queryFn: () => vaccinationRemindersApi.getStats(organizationId),
    // Refresh every 5 minutes
    refetchInterval: 5 * 60 * 1000,
  })
}

// ============================================
// Re-export types for convenience
// ============================================

export type { PetWithExpiringVaccinations, BookingEligibility }
