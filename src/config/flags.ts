import type { FeatureFlags } from '@/types'

export const featureFlags: FeatureFlags = {
  multiStaffScheduling: false,
  onlinePayments: false,
  smsReminders: false,
  emailReminders: true,
  clientPortal: true,
  petPhotos: false,
  inventoryManagement: false,
}

export function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
  return featureFlags[flag]
}
