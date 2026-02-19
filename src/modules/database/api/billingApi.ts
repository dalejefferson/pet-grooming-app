import { supabase } from '@/lib/supabase/client'
import type { Subscription, StripeInvoice, StripePaymentMethod } from '../types'
import { mapSubscription } from '../types/supabase-mappers'

export interface InvoiceListResult {
  invoices: StripeInvoice[]
  hasMore: boolean
  paymentMethod: StripePaymentMethod | null
}

export const billingApi = {
  async getSubscription(): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(error.message)
    }

    return data ? mapSubscription(data) : null
  },

  async createCheckoutSession(
    planTier: 'solo' | 'studio',
    billingInterval: 'monthly' | 'yearly'
  ): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ planTier, billingInterval }),
      }
    )

    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Failed to create checkout session')

    return result.url
  },

  async listInvoices(startingAfter?: string): Promise<InvoiceListResult> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/list-invoices`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ startingAfter }),
      }
    )

    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Failed to list invoices')

    return result as InvoiceListResult
  },

  async createPortalSession(): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      }
    )

    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Failed to create portal session')

    return result.url
  },

  async cancelSubscription(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-subscription`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      }
    )

    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Failed to cancel subscription')
  },
}
