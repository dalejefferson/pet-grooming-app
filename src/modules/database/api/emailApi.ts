import { supabase } from '@/lib/supabase/client'
import { buildTestEmail, buildReadyForPickupEmail, buildAppointmentReminderEmail, buildVaccinationReminderEmail, buildBookingConfirmationEmail, buildNewBookingAlertEmail } from '@/modules/notifications/templates/emailTemplates'

function validateEmail(email: string): void {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error(`Invalid email address: ${email}`)
  }
}

interface SendEmailOptions {
  to: string
  subject: string
  body?: string
  html?: string
  replyTo?: string
  senderName?: string
}

interface SendEmailResult {
  messageId: string
}

export const emailApi = {
  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    validateEmail(options.to)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(options),
      }
    )

    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Failed to send email')
    return result
  },

  async sendTestEmail(options: { to: string; replyTo?: string; senderName?: string }): Promise<SendEmailResult> {
    validateEmail(options.to)
    const businessName = options.senderName || 'Sit Pretty Club'
    const { subject, html } = buildTestEmail({ businessName })

    return this.sendEmail({
      to: options.to,
      subject,
      html,
      replyTo: options.replyTo,
      senderName: options.senderName,
    })
  },

  async sendReadyForPickupEmail(params: {
    to: string
    clientName: string
    petNames: string
    businessName: string
    replyTo?: string
    senderName?: string
  }): Promise<SendEmailResult> {
    validateEmail(params.to)
    const { subject, html } = buildReadyForPickupEmail({
      clientName: params.clientName,
      petNames: params.petNames,
      businessName: params.businessName,
    })
    return this.sendEmail({
      to: params.to,
      subject,
      html,
      replyTo: params.replyTo,
      senderName: params.senderName,
    })
  },

  async sendAppointmentReminderEmail(params: {
    to: string
    clientName: string
    petName: string
    date: string
    time: string
    businessName: string
    replyTo?: string
    senderName?: string
  }): Promise<SendEmailResult> {
    validateEmail(params.to)
    const { subject, html } = buildAppointmentReminderEmail({
      clientName: params.clientName,
      petName: params.petName,
      date: params.date,
      time: params.time,
      businessName: params.businessName,
    })
    return this.sendEmail({
      to: params.to,
      subject,
      html,
      replyTo: params.replyTo,
      senderName: params.senderName,
    })
  },

  async sendVaccinationReminderEmail(params: {
    to: string
    clientName: string
    petName: string
    vaccinationName: string
    expirationDate: string
    urgency: '30_day' | '7_day' | 'expired'
    businessName: string
    replyTo?: string
    senderName?: string
  }): Promise<SendEmailResult> {
    validateEmail(params.to)
    const { subject, html } = buildVaccinationReminderEmail({
      clientName: params.clientName,
      petName: params.petName,
      vaccinationName: params.vaccinationName,
      expirationDate: params.expirationDate,
      urgency: params.urgency,
      businessName: params.businessName,
    })
    return this.sendEmail({
      to: params.to,
      subject,
      html,
      replyTo: params.replyTo,
      senderName: params.senderName,
    })
  },

  /**
   * Send booking confirmation email to client.
   * Uses bookingId-based auth (no JWT needed) so the public booking flow can call this.
   */
  async sendBookingConfirmationEmail(params: {
    bookingId: string
    clientName: string
    petNames: string
    date: string
    time: string
    groomerName?: string
    totalAmount: string
    businessName: string
    isRequested: boolean
    replyTo?: string
    senderName?: string
  }): Promise<SendEmailResult> {
    const { subject, html } = buildBookingConfirmationEmail({
      clientName: params.clientName,
      petNames: params.petNames,
      date: params.date,
      time: params.time,
      groomerName: params.groomerName,
      totalAmount: params.totalAmount,
      businessName: params.businessName,
      isRequested: params.isRequested,
    })

    // Use bookingId auth mode (no JWT required)
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: params.bookingId,
          subject,
          html,
          senderName: params.senderName,
          replyTo: params.replyTo,
        }),
      }
    )

    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Failed to send email')
    return result
  },

  /**
   * Send new booking alert to the assigned groomer.
   * Uses bookingId-based auth with staffAlert flag so public booking flow can call this.
   */
  async sendNewBookingAlertEmail(params: {
    bookingId: string
    groomerName: string
    clientName: string
    petNames: string
    date: string
    time: string
    isNewClient: boolean
    businessName: string
    senderName?: string
  }): Promise<SendEmailResult> {
    const { subject, html } = buildNewBookingAlertEmail({
      groomerName: params.groomerName,
      clientName: params.clientName,
      petNames: params.petNames,
      date: params.date,
      time: params.time,
      isNewClient: params.isNewClient,
      businessName: params.businessName,
    })

    // Use bookingId auth mode with staffAlert flag
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: params.bookingId,
          staffAlert: true,
          subject,
          html,
          senderName: params.senderName,
        }),
      }
    )

    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Failed to send email')
    return result
  },
}
