// Shared validation utilities — simple boolean checks and constants

/** RFC-compliant email check */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(email)
}

/** Accepts digits, spaces, dashes, parens, optional leading +. Must have 10-15 digits. */
export function isValidPhone(phone: string): boolean {
  const digitsOnly = phone.replace(/\D/g, '')
  return digitsOnly.length >= 10 && digitsOnly.length <= 15
}

// Error message constants
export const EMAIL_ERROR = 'Please enter a valid email address'
export const PHONE_ERROR = 'Please enter a valid phone number'

/** Strip everything except digits, +, -, (, ), spaces */
export function sanitizePhoneInput(value: string): string {
  return value.replace(/[^\d+\-() ]/g, '')
}

// Character limit constants
export const PHONE_MAX_LENGTH = 20
export const NOTES_MAX_LENGTH = 500
export const DESCRIPTION_MAX_LENGTH = 300
export const POLICY_MAX_LENGTH = 1000
