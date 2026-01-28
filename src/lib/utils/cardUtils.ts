import type { CardBrand } from '@/types'

/**
 * Detect card brand from card number prefix
 */
export function detectCardBrand(cardNumber: string): CardBrand {
  // Remove spaces and non-digits
  const cleaned = cardNumber.replace(/\D/g, '')

  if (!cleaned) return 'unknown'

  // Visa: starts with 4
  if (/^4/.test(cleaned)) return 'visa'

  // Mastercard: starts with 51-55 or 2221-2720
  if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return 'mastercard'

  // American Express: starts with 34 or 37
  if (/^3[47]/.test(cleaned)) return 'amex'

  // Discover: starts with 6011, 65, or 644-649
  if (/^6011/.test(cleaned) || /^65/.test(cleaned) || /^64[4-9]/.test(cleaned)) return 'discover'

  return 'unknown'
}

/**
 * Validate card number using Luhn algorithm
 */
export function validateCardNumber(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/\D/g, '')

  if (cleaned.length < 13 || cleaned.length > 19) return false

  let sum = 0
  let isEven = false

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i], 10)

    if (isEven) {
      digit *= 2
      if (digit > 9) digit -= 9
    }

    sum += digit
    isEven = !isEven
  }

  return sum % 10 === 0
}

/**
 * Validate expiration date (MM/YY format)
 */
export function validateExpirationDate(expiry: string): boolean {
  const cleaned = expiry.replace(/\D/g, '')

  if (cleaned.length !== 4) return false

  const month = parseInt(cleaned.slice(0, 2), 10)
  const year = parseInt(cleaned.slice(2, 4), 10)

  if (month < 1 || month > 12) return false

  const currentDate = new Date()
  const currentYear = currentDate.getFullYear() % 100
  const currentMonth = currentDate.getMonth() + 1

  // Card has expired if year is before current year
  // or if same year but month is before current month
  if (year < currentYear) return false
  if (year === currentYear && month < currentMonth) return false

  return true
}

/**
 * Validate CVC (3-4 digits)
 */
export function validateCVC(cvc: string, brand: CardBrand = 'unknown'): boolean {
  const cleaned = cvc.replace(/\D/g, '')

  // Amex uses 4-digit CVC, others use 3
  const requiredLength = brand === 'amex' ? 4 : 3

  return cleaned.length === requiredLength
}

/**
 * Format card number with spaces
 */
export function formatCardNumber(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\D/g, '')
  const brand = detectCardBrand(cleaned)

  // Amex has different grouping: 4-6-5
  if (brand === 'amex') {
    return cleaned
      .slice(0, 15)
      .replace(/(\d{4})(\d{0,6})(\d{0,5})/, (_, p1, p2, p3) => {
        let result = p1
        if (p2) result += ' ' + p2
        if (p3) result += ' ' + p3
        return result
      })
  }

  // Standard grouping: 4-4-4-4
  return cleaned
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ')
}

/**
 * Format expiration date (MM/YY)
 */
export function formatExpirationDate(expiry: string): string {
  const cleaned = expiry.replace(/\D/g, '')

  if (cleaned.length <= 2) {
    return cleaned
  }

  return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4)
}

/**
 * Mask card number (show last 4 digits)
 */
export function maskCardNumber(cardNumber: string): string {
  const cleaned = cardNumber.replace(/\D/g, '')
  if (cleaned.length < 4) return '****'

  const last4 = cleaned.slice(-4)
  const brand = detectCardBrand(cleaned)

  if (brand === 'amex') {
    return '**** ****** *' + last4
  }

  return '**** **** **** ' + last4
}

/**
 * Get display name for card brand
 */
export function getCardBrandName(brand: CardBrand): string {
  switch (brand) {
    case 'visa':
      return 'Visa'
    case 'mastercard':
      return 'Mastercard'
    case 'amex':
      return 'American Express'
    case 'discover':
      return 'Discover'
    default:
      return 'Card'
  }
}

/**
 * Get card brand icon/emoji (for simple display)
 */
export function getCardBrandIcon(brand: CardBrand): string {
  switch (brand) {
    case 'visa':
      return 'VISA'
    case 'mastercard':
      return 'MC'
    case 'amex':
      return 'AMEX'
    case 'discover':
      return 'DISC'
    default:
      return 'CARD'
  }
}

/**
 * Parse expiration date string to month and year
 */
export function parseExpirationDate(expiry: string): { month: number; year: number } | null {
  const cleaned = expiry.replace(/\D/g, '')

  if (cleaned.length !== 4) return null

  const month = parseInt(cleaned.slice(0, 2), 10)
  const year = 2000 + parseInt(cleaned.slice(2, 4), 10)

  if (month < 1 || month > 12) return null

  return { month, year }
}

/**
 * Check if card is expired
 */
export function isCardExpired(expMonth: number, expYear: number): boolean {
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1

  if (expYear < currentYear) return true
  if (expYear === currentYear && expMonth < currentMonth) return true

  return false
}

/**
 * Validate all card fields
 */
export function validateCard(
  cardNumber: string,
  expiry: string,
  cvc: string
): { isValid: boolean; errors: { cardNumber?: string; expiry?: string; cvc?: string } } {
  const errors: { cardNumber?: string; expiry?: string; cvc?: string } = {}
  const brand = detectCardBrand(cardNumber)

  if (!validateCardNumber(cardNumber)) {
    errors.cardNumber = 'Invalid card number'
  }

  if (!validateExpirationDate(expiry)) {
    errors.expiry = 'Invalid or expired date'
  }

  if (!validateCVC(cvc, brand)) {
    errors.cvc = brand === 'amex' ? 'CVC must be 4 digits' : 'CVC must be 3 digits'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}
