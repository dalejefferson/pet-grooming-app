/**
 * Mock SMS Service
 * Simulates SMS sending for development/demo purposes
 * Will be replaced with Twilio integration
 */

const STORAGE_KEY = 'sent_sms'

export interface SentSms {
  id: string
  to: string
  body: string
  sentAt: string
}

/**
 * Simulates sending an SMS
 */
export async function sendSms(to: string, body: string): Promise<SentSms> {
  // Simulate network delay (200-500ms)
  const delay = 200 + Math.random() * 300
  await new Promise((resolve) => setTimeout(resolve, delay))

  const sms: SentSms = {
    id: crypto.randomUUID(),
    to,
    body,
    sentAt: new Date().toISOString(),
  }

  // Log to console for debugging
  console.log(`[SMS Service] Sending SMS:`, {
    to: sms.to,
    body: sms.body.substring(0, 50) + (sms.body.length > 50 ? '...' : ''),
  })

  // Store in localStorage for dev visibility
  try {
    const messages = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    messages.push(sms)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  } catch { /* ignore storage errors */ }

  return sms
}

/**
 * Retrieves the history of sent SMS messages
 */
export function getSmsHistory(): SentSms[] {
  try {
    const messages: SentSms[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return messages.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())
  } catch {
    return []
  }
}

/**
 * Clears all sent SMS history
 */
export function clearSmsHistory(): void {
  localStorage.removeItem(STORAGE_KEY)
}
