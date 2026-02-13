import { supabase } from '@/lib/supabase/client'

interface SendEmailOptions {
  to: string
  subject: string
  body: string
  replyTo?: string
  senderName?: string
}

interface SendEmailResult {
  messageId: string
}

export const emailApi = {
  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
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
    return this.sendEmail({
      to: options.to,
      subject: `Test Email from ${options.senderName || 'Sit Pretty Club'}`,
      body: 'This is a test email from your Sit Pretty Club account. If you received this, your email settings are working correctly!',
      replyTo: options.replyTo,
      senderName: options.senderName,
    })
  },
}
