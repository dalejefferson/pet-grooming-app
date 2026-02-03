import type { PaymentMethod } from '../types'
import { supabase } from '@/lib/supabase/client'
import { mapPaymentMethod, toDbPaymentMethod } from '../types/supabase-mappers'
import {
  mockStripe,
  toPaymentMethod,
  type CardDetails,
  type MockPaymentConfirmation,
} from '@/lib/stripe/mockStripe'

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
   *
   * Uses mockStripe to validate and create the payment method,
   * then stores it in the payment_methods table
   */
  async create(clientId: string, cardDetails: CardDetails): Promise<PaymentMethod> {
    // First, use mockStripe to create and validate the payment method
    const stripeResponse = await mockStripe.createPaymentMethod(cardDetails)

    // Check if client has existing methods
    const existingMethods = await this.getByClientId(clientId)
    const isDefault = existingMethods.length === 0

    // Convert the Stripe response to our PaymentMethod type
    const paymentMethod = toPaymentMethod(stripeResponse, clientId, isDefault)

    // Insert into Supabase
    const dbRow = toDbPaymentMethod(paymentMethod)
    dbRow.id = paymentMethod.id

    const { data: row, error } = await supabase
      .from('payment_methods')
      .insert(dbRow)
      .select()
      .single()

    if (error) throw error
    return mapPaymentMethod(row)
  },

  /**
   * Delete a payment method
   *
   * If the deleted method was the default, the first remaining method
   * becomes the new default
   */
  async delete(paymentMethodId: string): Promise<void> {
    // Call mockStripe to simulate deletion
    await mockStripe.deletePaymentMethod(paymentMethodId)

    // Get the payment method to check if it was default
    const { data: pmRow, error: fetchError } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('id', paymentMethodId)
      .single()

    if (fetchError) throw fetchError
    if (!pmRow) throw new Error('Payment method not found')

    const wasDefault = pmRow.is_default
    const clientId = pmRow.client_id

    // Delete the payment method
    const { error: deleteError } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', paymentMethodId)

    if (deleteError) throw deleteError

    // If the deleted method was the default, make the first remaining one the new default
    if (wasDefault) {
      const { data: remaining } = await supabase
        .from('payment_methods')
        .select('id')
        .eq('client_id', clientId)
        .order('created_at', { ascending: true })
        .limit(1)

      if (remaining && remaining.length > 0) {
        const { error: updateError } = await supabase
          .from('payment_methods')
          .update({ is_default: true })
          .eq('id', remaining[0].id)

        if (updateError) throw updateError
      }
    }
  },

  /**
   * Set a payment method as the default for a client
   *
   * Unsets the current default and sets the specified method as default
   */
  async setDefault(clientId: string, paymentMethodId: string): Promise<PaymentMethod> {
    // Unset all defaults for this client
    const { error: unsetError } = await supabase
      .from('payment_methods')
      .update({ is_default: false })
      .eq('client_id', clientId)

    if (unsetError) throw unsetError

    // Set the specified method as default
    const { data: row, error: setError } = await supabase
      .from('payment_methods')
      .update({ is_default: true })
      .eq('id', paymentMethodId)
      .select()
      .single()

    if (setError) throw setError
    return mapPaymentMethod(row)
  },

  /**
   * Process a payment using a stored payment method
   */
  async processPayment(
    clientId: string,
    paymentMethodId: string,
    amount: number,
    currency: string = 'usd'
  ): Promise<MockPaymentConfirmation> {
    // Verify the payment method exists and belongs to the client
    const { data: pmRow, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('id', paymentMethodId)
      .eq('client_id', clientId)
      .single()

    if (error) throw error
    if (!pmRow) throw new Error('Payment method not found')

    // Use mockStripe to process the payment
    return mockStripe.confirmPayment(amount, paymentMethodId, currency)
  },

  /**
   * Get the default payment method for a client
   */
  async getDefault(clientId: string): Promise<PaymentMethod | null> {
    // Try to get the explicitly-set default
    const { data: defaultRow } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('client_id', clientId)
      .eq('is_default', true)
      .maybeSingle()

    if (defaultRow) return mapPaymentMethod(defaultRow)

    // Fall back to the first payment method
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
