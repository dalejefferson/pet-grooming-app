import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { remindersApi } from '@/lib/api'
import type { ReminderSchedule, Appointment, Client, Pet } from '@/types'

export function useReminders(organizationId?: string) {
  return useQuery({
    queryKey: ['reminders', organizationId],
    queryFn: () => remindersApi.get(organizationId),
  })
}

export function useUpdateReminders() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Partial<ReminderSchedule>) => remindersApi.update(data),
    onSuccess: (updatedReminders) => {
      queryClient.setQueryData(
        ['reminders', updatedReminders.organizationId],
        updatedReminders
      )
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
    },
  })
}

export function useUpdateAppointmentReminders() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (settings: Partial<ReminderSchedule['appointmentReminders']>) =>
      remindersApi.updateAppointmentReminders(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
    },
  })
}

export function useUpdateDueForGrooming() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (settings: Partial<ReminderSchedule['dueForGrooming']>) =>
      remindersApi.updateDueForGrooming(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
    },
  })
}

export function usePreviewReminder(
  templateKey: '48h' | '24h' | '2h' | 'dueForGrooming',
  appointment?: Appointment,
  client?: Client,
  pet?: Pet
) {
  return useQuery({
    queryKey: ['reminderPreview', templateKey, appointment?.id, client?.id, pet?.id],
    queryFn: () => remindersApi.previewReminder(templateKey, appointment, client, pet),
  })
}

export function useDefaultTemplates() {
  return useQuery({
    queryKey: ['reminderTemplates'],
    queryFn: () => remindersApi.getDefaultTemplates(),
  })
}
