import type { ReminderSchedule, Appointment, Client, Pet } from '@/types'
import { getFromStorage, setToStorage, delay } from './storage'
import { seedReminders } from './seed'
import { format, parseISO } from 'date-fns'

const STORAGE_KEY = 'reminders'

function getReminders(): ReminderSchedule {
  return getFromStorage<ReminderSchedule>(STORAGE_KEY, seedReminders)
}

function saveReminders(reminders: ReminderSchedule): void {
  setToStorage(STORAGE_KEY, reminders)
}

export const remindersApi = {
  async get(organizationId?: string): Promise<ReminderSchedule> {
    await delay()
    const reminders = getReminders()
    // For MVP, we only have one organization
    if (organizationId && reminders.organizationId !== organizationId) {
      return seedReminders
    }
    return reminders
  },

  async update(data: Partial<ReminderSchedule>): Promise<ReminderSchedule> {
    await delay()
    const reminders = getReminders()
    const updated: ReminderSchedule = {
      ...reminders,
      ...data,
      updatedAt: new Date().toISOString(),
    }
    saveReminders(updated)
    return updated
  },

  async updateAppointmentReminders(
    settings: Partial<ReminderSchedule['appointmentReminders']>
  ): Promise<ReminderSchedule> {
    const reminders = await this.get()
    return this.update({
      appointmentReminders: {
        ...reminders.appointmentReminders,
        ...settings,
      },
    })
  },

  async updateDueForGrooming(
    settings: Partial<ReminderSchedule['dueForGrooming']>
  ): Promise<ReminderSchedule> {
    const reminders = await this.get()
    return this.update({
      dueForGrooming: {
        ...reminders.dueForGrooming,
        ...settings,
      },
    })
  },

  async previewReminder(
    templateKey: '48h' | '24h' | '2h' | 'dueForGrooming',
    appointment?: Appointment,
    client?: Client,
    pet?: Pet
  ): Promise<string> {
    await delay()
    const reminders = await this.get()

    let template: string
    if (templateKey === 'dueForGrooming') {
      template = reminders.dueForGrooming.template
    } else {
      const key = `template${templateKey}` as keyof typeof reminders.appointmentReminders
      template = reminders.appointmentReminders[key] as string
    }

    // Replace placeholders with sample or actual data
    const replacements: Record<string, string> = {
      '{{clientName}}': client?.firstName || 'Jane',
      '{{petName}}': pet?.name || 'Max',
      '{{date}}': appointment
        ? format(parseISO(appointment.startTime), 'EEEE, MMMM d')
        : 'Monday, January 15',
      '{{time}}': appointment
        ? format(parseISO(appointment.startTime), 'h:mm a')
        : '10:00 AM',
    }

    let preview = template
    Object.entries(replacements).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(key, 'g'), value)
    })

    return preview
  },

  async getDefaultTemplates(): Promise<{
    template48h: string
    template24h: string
    template2h: string
    dueForGrooming: string
  }> {
    await delay()
    return {
      template48h:
        "Hi {{clientName}}! This is a reminder that {{petName}}'s grooming appointment is in 2 days on {{date}} at {{time}}. Reply CONFIRM to confirm or call us to reschedule.",
      template24h:
        "Reminder: {{petName}}'s grooming appointment is tomorrow at {{time}}. Please arrive 5 minutes early. See you soon!",
      template2h:
        "{{petName}}'s appointment starts in 2 hours at {{time}}. We're looking forward to seeing you!",
      dueForGrooming:
        "Hi {{clientName}}! It's been a while since {{petName}}'s last groom. Ready to book their next appointment? Visit our booking page or give us a call!",
    }
  },
}
