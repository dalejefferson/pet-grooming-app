import type { BookingPolicies } from '../types'
import { supabase } from '@/lib/supabase/client'
import { mapBookingPolicies, toDbBookingPolicies } from '../types/supabase-mappers'

export const policiesApi = {
  async get(organizationId?: string): Promise<BookingPolicies | null> {
    if (!organizationId) {
      const { data, error } = await supabase
        .from('booking_policies')
        .select('*')
        .limit(1)
        .maybeSingle()

      if (error) throw error
      return data ? mapBookingPolicies(data) : null
    }

    const { data, error } = await supabase
      .from('booking_policies')
      .select('*')
      .eq('organization_id', organizationId)
      .maybeSingle()

    if (error) throw error
    return data ? mapBookingPolicies(data) : null
  },

  async update(data: Partial<BookingPolicies>): Promise<BookingPolicies> {
    const dbData = toDbBookingPolicies(data)

    const { data: row, error } = await supabase
      .from('booking_policies')
      .upsert(dbData, { onConflict: 'organization_id' })
      .select()
      .single()

    if (error) throw error
    return mapBookingPolicies(row)
  },

  async generatePolicyText(policies: BookingPolicies): Promise<string> {
    const parts: string[] = []

    if (policies.depositRequired) {
      parts.push(
        `A ${policies.depositPercentage}% deposit (minimum $${policies.depositMinimum}) is required to confirm your appointment.`
      )
    }

    if (policies.cancellationWindowHours > 0) {
      parts.push(
        `Cancellations made less than ${policies.cancellationWindowHours} hours in advance are subject to a ${policies.lateCancellationFeePercentage}% cancellation fee.`
      )
    }

    if (policies.noShowFeePercentage > 0) {
      parts.push(
        `No-shows will be charged ${policies.noShowFeePercentage}% of the appointment total.`
      )
    }

    if (policies.newClientMode === 'request_only') {
      parts.push(
        'New client appointments require confirmation from our team before they are finalized.'
      )
    }

    return parts.join(' ')
  },

  async calculateDeposit(totalAmount: number, organizationId: string): Promise<number> {
    const policies = await this.get(organizationId)
    if (!policies || !policies.depositRequired) return 0

    const percentageDeposit = (totalAmount * policies.depositPercentage) / 100
    return Math.max(percentageDeposit, policies.depositMinimum)
  },
}
