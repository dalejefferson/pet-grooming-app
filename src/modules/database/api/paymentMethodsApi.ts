import type { PaymentMethod } from '../types'
import { supabase } from '@/lib/supabase/client'
import { mapPaymentMethod } from '../types/supabase-mappers'

const COMING_SOON_ERROR = 'Payment methods coming soon. Manage billing via the Stripe portal.'

/** Placeholder type — will be replaced by Stripe Setup Intents */
export interface CardDetails {
  number: string
  expiry: string
  cvc: string
  name?: string
}

export const paymentMethodsApi = {
  /**
   * Get all payment methods for a client
   */
  async getByClientId(clientId: string): Promise<PaymentMethod[]> {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data ?? []).map(mapPaymentMethod)
  },

  /**
   * Create a new payment method for a client
   * @deprecated Will be replaced by Stripe Setup Intents
   */
  async create(_clientId: string, _cardDetails: CardDetails): Promise<PaymentMethod> {
    throw new Error(COMING_SOON_ERROR)
  },

  /**
   * Delete a payment method
   * @deprecated Will be replaced by Stripe Setup Intents
   */
  async delete(_paymentMethodId: string): Promise<void> {
    throw new Error(COMING_SOON_ERROR)
  },

  /**
   * Set a payment method as the default for a client
   * @deprecated Will be replaced by Stripe Setup Intents
   */
  async setDefault(_clientId: string, _paymentMethodId: string): Promise<PaymentMethod> {
    throw new Error(COMING_SOON_ERROR)
  },

  /**
   * Process a payment using a stored payment method
   * @deprecated Will be replaced by Stripe Payment Intents
   */
  async processPayment(
    _clientId: string,
    _paymentMethodId: string,
    _amount: number,
    _currency: string = 'usd'
  ): Promise<{ success: boolean; error?: string; amount: number; currency: string }> {
    throw new Error(COMING_SOON_ERROR)
  },

  /**
   * Get the default payment method for a client
   */
  async getDefault(clientId: string): Promise<PaymentMethod | null> {
    const { data: defaultRow } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_default', true)
      .maybeSingle()

    if (defaultRow) return mapPaymentMethod(defaultRow)

    const { data: firstRow } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    return firstRow ? mapPaymentMethod(firstRow) : null
  },
}
