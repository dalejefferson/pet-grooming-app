/**
 * Mock SMS Service
 * Simulates SMS sending with localStorage persistence for development/demo purposes
 */

import { getFromStorage, setToStorage, generateId } from '@/modules/database/storage/localStorage'

const STORAGE_KEY = 'sent_sms'

export interface SentSms {
  id: string
  to: string
  body: string
  sentAt: string
}

/**
 * Simulates sending an SMS
 * @param to - Recipient phone number
 * @param body - SMS message content
 * @returns The sent SMS record
 */
export async function sendSms(to: string, body: string): Promise<SentSms> {
  // Simulate network delay (200-500ms)
  const delay = 200 + Math.random() * 300
  await new Promise((resolve) => setTimeout(resolve, delay))

  const sms: SentSms = {
    id: generateId(),
    to,
    body,
    sentAt: new Date().toISOString(),
  }

  // Log to console for debugging
  console.log(`[SMS Service] Sending SMS:`, {
    to: sms.to,
    body: sms.body.substring(0, 50) + (sms.body.length > 50 ? '...' : ''),
  })

  // Store in localStorage
  const messages = getFromStorage<SentSms[]>(STORAGE_KEY, [])
  messages.push(sms)
  setToStorage(STORAGE_KEY, messages)

  return sms
}

/**
 * Retrieves the history of sent SMS messages
 * @returns Array of sent SMS messages, newest first
 */
export function getSmsHistory(): SentSms[] {
  const messages = getFromStorage<SentSms[]>(STORAGE_KEY, [])
  return messages.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
}

/**
 * Clears all sent SMS history
 */
export function clearSmsHistory(): void {
  setToStorage(STORAGE_KEY, [])
}
