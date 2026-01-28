/**
 * Mock Stripe API for development
 *
 * Simulates Stripe payment method operations without requiring
 * an actual Stripe account or API keys.
 */

import type { CardBrand, PaymentMethod } from '@/types'
import { detectCardBrand, validateCard, parseExpirationDate } from '@/lib/utils/cardUtils'

// ============================================
// Types
// ============================================

export interface CardDetails {
  number: string
  expiry: string // MM/YY format
  cvc: string
  name?: string
}

export interface MockPaymentMethodResponse {
  id: string
  type: 'card'
  card: {
    brand: CardBrand
    last4: string
    expMonth: number
    expYear: number
  }
  created: number
}

export interface MockPaymentConfirmation {
  success: boolean
  transactionId?: string
  error?: string
  amount: number
  currency: string
}

export interface MockDeletionResponse {
  deleted: boolean
  id: string
}

// ============================================
// Utilities
// ============================================

/**
 * Simulate network delay (100-300ms)
 */
function simulateNetworkDelay(): Promise<void> {
  const delay = Math.floor(Math.random() * 200) + 100 // 100-300ms
  return new Promise((resolve) => setTimeout(resolve, delay))
}

/**
 * Generate a mock Stripe payment method ID
 */
function generatePaymentMethodId(): string {
  return `pm_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Generate a mock transaction ID
 */
function generateTransactionId(): string {
  return `txn_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
}

// ============================================
// Mock Stripe API Functions
// ============================================

/**
 * Create a mock payment method from card details
 *
 * Validates the card and returns a payment method object similar to Stripe's API
 */
export async function createPaymentMethod(
  cardDetails: CardDetails
): Promise<MockPaymentMethodResponse> {
  await simulateNetworkDelay()

  // Validate the card
  const validation = validateCard(cardDetails.number, cardDetails.expiry, cardDetails.cvc)

  if (!validation.isValid) {
    const errorMessages = Object.values(validation.errors).filter(Boolean)
    throw new Error(errorMessages[0] || 'Invalid card details')
  }

  // Parse expiration date
  const expDate = parseExpirationDate(cardDetails.expiry)
  if (!expDate) {
    throw new Error('Invalid expiration date')
  }

  // Detect card brand
  const brand = detectCardBrand(cardDetails.number)

  // Get last 4 digits
  const cleanedNumber = cardDetails.number.replace(/\D/g, '')
  const last4 = cleanedNumber.slice(-4)

  return {
    id: generatePaymentMethodId(),
    type: 'card',
    card: {
      brand,
      last4,
      expMonth: expDate.month,
      expYear: expDate.year,
    },
    created: Date.now(),
  }
}

/**
 * Confirm a mock payment
 *
 * Simulates processing a payment with the given amount and payment method
 * Has a 95% success rate to simulate real-world conditions
 */
export async function confirmPayment(
  amount: number,
  paymentMethodId: string,
  currency: string = 'usd'
): Promise<MockPaymentConfirmation> {
  await simulateNetworkDelay()

  // Validate inputs
  if (amount <= 0) {
    return {
      success: false,
      error: 'Invalid payment amount',
      amount,
      currency,
    }
  }

  if (!paymentMethodId || !paymentMethodId.startsWith('pm_')) {
    return {
      success: false,
      error: 'Invalid payment method',
      amount,
      currency,
    }
  }

  // Simulate a 95% success rate
  const isSuccessful = Math.random() < 0.95

  if (!isSuccessful) {
    return {
      success: false,
      error: 'Payment declined. Please try a different card.',
      amount,
      currency,
    }
  }

  return {
    success: true,
    transactionId: generateTransactionId(),
    amount,
    currency,
  }
}

/**
 * Delete a mock payment method
 *
 * Simulates removing a payment method from Stripe
 */
export async function deletePaymentMethod(id: string): Promise<MockDeletionResponse> {
  await simulateNetworkDelay()

  if (!id || !id.startsWith('pm_')) {
    throw new Error('Invalid payment method ID')
  }

  return {
    deleted: true,
    id,
  }
}

/**
 * Convert a mock payment method response to the app's PaymentMethod type
 */
export function toPaymentMethod(
  response: MockPaymentMethodResponse,
  clientId: string,
  isDefault: boolean = false
): PaymentMethod {
  return {
    id: response.id,
    clientId,
    type: 'card',
    card: {
      brand: response.card.brand,
      last4: response.card.last4,
      expMonth: response.card.expMonth,
      expYear: response.card.expYear,
    },
    isDefault,
    createdAt: new Date(response.created).toISOString(),
  }
}

export const mockStripe = {
  createPaymentMethod,
  confirmPayment,
  deletePaymentMethod,
  toPaymentMethod,
}

export default mockStripe
