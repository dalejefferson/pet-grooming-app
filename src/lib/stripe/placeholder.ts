import type { Stripe } from '@stripe/stripe-js'

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY

let stripePromiseCache: Promise<Stripe | null> | null = null

export function getStripe(): Promise<Stripe | null> {
  if (!stripePublishableKey) return Promise.resolve(null)
  if (!stripePromiseCache) {
    stripePromiseCache = import('@stripe/stripe-js').then(({ loadStripe }) =>
      loadStripe(stripePublishableKey)
    )
  }
  return stripePromiseCache
}

export const isStripeConfigured = Boolean(stripePublishableKey)
