import type { ReminderSchedule, Appointment, Client, Pet } from '../types'
import { supabase } from '@/lib/supabase/client'
import { mapReminderSchedule, toDbReminderSchedule } from '../types/supabase-mappers'
import { format, parseISO } from 'date-fns'

export const remindersApi = {
  async get(organizationId?: string): Promise<ReminderSchedule | null> {
    if (!organizationId) {
      const { data, error } = await supabase
        .from('reminder_schedules')
        .select('*')
        .limit(1)
        .maybeSingle()

      if (error) throw error
      return data ? mapReminderSchedule(data) : null
    }

    const { data, error } = await supabase
      .from('reminder_schedules')
      .select('*')
      .eq('organization_id', organizationId)
      .maybeSingle()

    if (error) throw error
    return data ? mapReminderSchedule(data) : null
  },

  async update(data: Partial<ReminderSchedule>): Promise<ReminderSchedule> {
    const dbData = toDbReminderSchedule(data)

    const { data: row, error } = await supabase
      .from('reminder_schedules')
      .upsert(dbData, { onConflict: 'organization_id' })
      .select()
      .single()

    if (error) throw error
    return mapReminderSchedule(row)
  },

  async updateAppointmentReminders(
    settings: Partial<ReminderSchedule['appointmentReminders']>
  ): Promise<ReminderSchedule> {
    const reminders = await this.get()
    return this.update({
      organizationId: reminders?.organizationId,
      appointmentReminders: {
        ...(reminders?.appointmentReminders ?? {
          enabled48h: true, enabled24h: true, enabled2h: false,
          template48h: '', template24h: '', template2h: '',
        }),
        ...settings,
      },
    })
  },

  async updateDueForGrooming(
    settings: Partial<ReminderSchedule['dueForGrooming']>
  ): Promise<ReminderSchedule> {
    const reminders = await this.get()
    return this.update({
      organizationId: reminders?.organizationId,
      dueForGrooming: {
        ...(reminders?.dueForGrooming ?? {
          enabled: false, intervalDays: 42, template: '',
        }),
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
    const reminders = await this.get()

    let template: string
    if (templateKey === 'dueForGrooming') {
      template = reminders?.dueForGrooming.template ?? ''
    } else {
      const key = `template${templateKey}` as keyof NonNullable<typeof reminders>['appointmentReminders']
      template = (reminders?.appointmentReminders[key] as string) ?? ''
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
