import type { SubscriptionPlanTier, GatedFeature } from '@/modules/database/types'

/**
 * Maps each gated feature to the minimum tier required.
 * 'solo' means both Solo and Studio can access.
 * 'studio' means only Studio can access.
 */
export const FEATURE_TIER_MAP: Record<GatedFeature, SubscriptionPlanTier> = {
  multipleStaff: 'studio',
  rolePermissions: 'studio',
  serviceModifiers: 'studio',
  advancedReports: 'studio',
  staffScheduling: 'studio',
  performanceTracking: 'studio',
  prioritySupport: 'studio',
}

export const FEATURE_LABELS: Record<GatedFeature, { name: string; description: string }> = {
  multipleStaff: {
    name: 'Multiple Staff Accounts',
    description: 'Add unlimited staff members with individual logins.',
  },
  rolePermissions: {
    name: 'Role-Based Permissions',
    description: 'Control what each team member can see and do.',
  },
  serviceModifiers: {
    name: 'Dynamic Service Pricing',
    description: 'Adjust pricing based on weight, coat type, and breed.',
  },
  advancedReports: {
    name: 'Advanced Analytics',
    description: 'Export reports as PDF and CSV with detailed breakdowns.',
  },
  staffScheduling: {
    name: 'Staff Scheduling',
    description: 'Manage availability, shifts, and time-off requests.',
  },
  performanceTracking: {
    name: 'Performance Tracking',
    description: 'Track individual staff metrics and productivity.',
  },
  prioritySupport: {
    name: 'Priority Support',
    description: 'Get faster response times from our support team.',
  },
}

export const TIER_STAFF_LIMITS: Record<SubscriptionPlanTier, number> = {
  solo: 1,
  studio: Infinity,
}

export function getStaffLimit(tier: SubscriptionPlanTier | null): number {
  if (!tier) return 1
  return TIER_STAFF_LIMITS[tier]
}

const TIER_RANK: Record<SubscriptionPlanTier, number> = { solo: 1, studio: 2 }

export function tierSatisfies(
  userTier: SubscriptionPlanTier | null,
  requiredTier: SubscriptionPlanTier
): boolean {
  if (!userTier) return false
  return TIER_RANK[userTier] >= TIER_RANK[requiredTier]
}
