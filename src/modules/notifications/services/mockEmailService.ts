/**
 * Mock Email Service
 * Simulates email sending for development/demo purposes
 * Will be replaced with Resend integration
 */

const STORAGE_KEY = 'sent_emails'

export interface SentEmail {
  id: string
  to: string
  subject: string
  body: string
  sentAt: string
}

/**
 * Simulates sending an email
 */
export async function sendEmail(to: string, subject: string, body: string): Promise<SentEmail> {
  // Simulate network delay (200-500ms)
  const delay = 200 + Math.random() * 300
  await new Promise((resolve) => setTimeout(resolve, delay))

  const email: SentEmail = {
    id: crypto.randomUUID(),
    to,
    subject,
    body,
    sentAt: new Date().toISOString(),
  }

  // Log to console for debugging
  console.log(`[Email Service] Sending email:`, {
    to: email.to,
    subject: email.subject,
    body: email.body.substring(0, 100) + (email.body.length > 100 ? '...' : ''),
  })

  // Store in localStorage for dev visibility
  try {
    const emails = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    emails.push(email)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(emails))
  } catch { /* ignore storage errors */ }

  return email
}

/**
 * Retrieves the history of sent emails
 */
export function getEmailHistory(): SentEmail[] {
  try {
    const emails: SentEmail[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return emails.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
  } catch {
    return []
  }
}

/**
 * Clears all sent email history
 */
export function clearEmailHistory(): void {
  localStorage.removeItem(STORAGE_KEY)
}
