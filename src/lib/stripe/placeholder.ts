/**
 * Stripe Client Placeholder
 *
 * This file is a placeholder for future Stripe integration.
 * When ready to integrate with Stripe:
 *
 * 1. Install Stripe: npm install @stripe/stripe-js @stripe/react-stripe-js
 * 2. Set environment variable:
 *    - VITE_STRIPE_PUBLISHABLE_KEY
 * 3. Uncomment and configure the code below
 */

// import { loadStripe } from '@stripe/stripe-js'

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

// Placeholder - replace with actual Stripe client when ready
export const stripe = {
  key: stripePublishableKey,
  isConfigured: Boolean(stripePublishableKey),
}

// Example of what the actual client would look like:
// export const stripePromise = loadStripe(stripePublishableKey)

export function createPaymentIntent(_amount: number, _currency: string = 'usd') {
  // Placeholder for creating payment intents
  // In production, this would call your backend to create a Stripe PaymentIntent
  console.warn('Stripe is not configured. Payment intent creation is mocked.')
  return Promise.resolve({
    clientSecret: 'mock_client_secret',
    amount: _amount,
    currency: _currency,
  })
}

export function processDeposit(_appointmentId: string, _amount: number) {
  // Placeholder for processing deposits
  console.warn('Stripe is not configured. Deposit processing is mocked.')
  return Promise.resolve({
    success: true,
    transactionId: `mock_txn_${Date.now()}`,
  })
}

export default stripe
