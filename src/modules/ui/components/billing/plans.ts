import type { SubscriptionStatus } from '@/modules/database/types'

export const PLANS = [
  { tier: 'solo' as const, name: 'Solo', monthlyPrice: 45, yearlyPrice: 432, desc: 'For independent groomers' },
  { tier: 'studio' as const, name: 'Studio', monthlyPrice: 95, yearlyPrice: 912, desc: 'For growing salons' },
]

export function getStatusBadge(status: SubscriptionStatus): {
  variant: 'success' | 'warning' | 'danger' | 'default' | 'themed'
  label: string
} {
  switch (status) {
    case 'active': return { variant: 'success', label: 'Active' }
    case 'trialing': return { variant: 'themed', label: 'Trial' }
    case 'past_due': return { variant: 'danger', label: 'Past Due' }
    case 'canceled': return { variant: 'default', label: 'Canceled' }
    default: return { variant: 'default', label: status }
  }
}
