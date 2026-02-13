import type { FeatureFlags } from '@/types'

export const featureFlags: FeatureFlags = {
  multiStaffScheduling: false,
  onlinePayments: false,
  emailReminders: true,
  clientPortal: true,
  petPhotos: false,
  inventoryManagement: false,
  devBypassSubscription: import.meta.env.VITE_DEV_BYPASS_SUBSCRIPTION === 'true',
}

export function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
  return featureFlags[flag]
}
