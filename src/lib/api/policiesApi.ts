import type { BookingPolicies } from '@/types'
import { getFromStorage, setToStorage, delay } from './storage'
import { seedPolicies } from './seed'

const STORAGE_KEY = 'policies'

function getPolicies(): BookingPolicies {
  return getFromStorage<BookingPolicies>(STORAGE_KEY, seedPolicies)
}

function savePolicies(policies: BookingPolicies): void {
  setToStorage(STORAGE_KEY, policies)
}

export const policiesApi = {
  async get(organizationId?: string): Promise<BookingPolicies> {
    await delay()
    const policies = getPolicies()
    // For MVP, we only have one organization
    if (organizationId && policies.organizationId !== organizationId) {
      // Return default policies if org doesn't match
      return seedPolicies
    }
    return policies
  },

  async update(data: Partial<BookingPolicies>): Promise<BookingPolicies> {
    await delay()
    const policies = getPolicies()
    const updated: BookingPolicies = {
      ...policies,
      ...data,
      updatedAt: new Date().toISOString(),
    }
    savePolicies(updated)
    return updated
  },

  async generatePolicyText(policies: BookingPolicies): Promise<string> {
    await delay()
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
    if (!policies.depositRequired) return 0

    const percentageDeposit = (totalAmount * policies.depositPercentage) / 100
    return Math.max(percentageDeposit, policies.depositMinimum)
  },
}
