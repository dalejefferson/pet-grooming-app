/**
 * Mock Email Service
 * Simulates email sending with localStorage persistence for development/demo purposes
 */

import { getFromStorage, setToStorage, generateId } from '@/modules/database/storage/localStorage'

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
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param body - Email body content
 * @returns The sent email record
 */
export async function sendEmail(to: string, subject: string, body: string): Promise<SentEmail> {
  // Simulate network delay (200-500ms)
  const delay = 200 + Math.random() * 300
  await new Promise((resolve) => setTimeout(resolve, delay))

  const email: SentEmail = {
    id: generateId(),
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

  // Store in localStorage
  const emails = getFromStorage<SentEmail[]>(STORAGE_KEY, [])
  emails.push(email)
  setToStorage(STORAGE_KEY, emails)

  return email
}

/**
 * Retrieves the history of sent emails
 * @returns Array of sent emails, newest first
 */
export function getEmailHistory(): SentEmail[] {
  const emails = getFromStorage<SentEmail[]>(STORAGE_KEY, [])
  return emails.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
}

/**
 * Clears all sent email history
 */
export function clearEmailHistory(): void {
  setToStorage(STORAGE_KEY, [])
}
