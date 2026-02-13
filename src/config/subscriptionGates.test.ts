import { describe, it, expect } from 'vitest'
import { FEATURE_TIER_MAP, FEATURE_LABELS, tierSatisfies, TIER_STAFF_LIMITS, getStaffLimit } from './subscriptionGates'
import type { GatedFeature, SubscriptionPlanTier } from '@/modules/database/types'

describe('subscriptionGates', () => {
  describe('tierSatisfies', () => {
    it('should return true when user tier equals required tier (solo)', () => {
      expect(tierSatisfies('solo', 'solo')).toBe(true)
    })

    it('should return true when user tier equals required tier (studio)', () => {
      expect(tierSatisfies('studio', 'studio')).toBe(true)
    })

    it('should return true when user tier exceeds required tier', () => {
      expect(tierSatisfies('studio', 'solo')).toBe(true)
    })

    it('should return false when user tier is below required tier', () => {
      expect(tierSatisfies('solo', 'studio')).toBe(false)
    })

    it('should return false when user tier is null', () => {
      expect(tierSatisfies(null, 'solo')).toBe(false)
    })

    it('should return false when user tier is null even for lowest tier', () => {
      expect(tierSatisfies(null, 'studio')).toBe(false)
    })
  })

  describe('FEATURE_TIER_MAP', () => {
    it('should have an entry for every GatedFeature', () => {
      const expectedFeatures: GatedFeature[] = [
        'multipleStaff',
        'rolePermissions',
        'serviceModifiers',
        'advancedReports',
        'staffScheduling',
        'performanceTracking',
        'prioritySupport',
      ]

      for (const feature of expectedFeatures) {
        expect(FEATURE_TIER_MAP).toHaveProperty(feature)
      }
    })

    it('should map all features to a valid SubscriptionPlanTier', () => {
      const validTiers: SubscriptionPlanTier[] = ['solo', 'studio']

      for (const tier of Object.values(FEATURE_TIER_MAP)) {
        expect(validTiers).toContain(tier)
      }
    })

    it('should require studio tier for all current features', () => {
      // All current gated features are studio-only
      for (const tier of Object.values(FEATURE_TIER_MAP)) {
        expect(tier).toBe('studio')
      }
    })

    it('should return the correct tier for a known feature', () => {
      expect(FEATURE_TIER_MAP['multipleStaff']).toBe('studio')
      expect(FEATURE_TIER_MAP['advancedReports']).toBe('studio')
      expect(FEATURE_TIER_MAP['prioritySupport']).toBe('studio')
    })
  })

  describe('FEATURE_LABELS', () => {
    it('should have a label entry for every feature in the tier map', () => {
      for (const feature of Object.keys(FEATURE_TIER_MAP)) {
        expect(FEATURE_LABELS).toHaveProperty(feature)
      }
    })

    it('should provide both name and description for each feature', () => {
      for (const label of Object.values(FEATURE_LABELS)) {
        expect(label).toHaveProperty('name')
        expect(label).toHaveProperty('description')
        expect(typeof label.name).toBe('string')
        expect(typeof label.description).toBe('string')
        expect(label.name.length).toBeGreaterThan(0)
        expect(label.description.length).toBeGreaterThan(0)
      }
    })
  })

  describe('TIER_STAFF_LIMITS', () => {
    it('should limit solo to 1 staff member', () => {
      expect(TIER_STAFF_LIMITS.solo).toBe(1)
    })

    it('should allow unlimited staff for studio', () => {
      expect(TIER_STAFF_LIMITS.studio).toBe(Infinity)
    })
  })

  describe('getStaffLimit', () => {
    it('should return 1 for solo tier', () => {
      expect(getStaffLimit('solo')).toBe(1)
    })

    it('should return Infinity for studio tier', () => {
      expect(getStaffLimit('studio')).toBe(Infinity)
    })

    it('should return 1 for null tier (no subscription)', () => {
      expect(getStaffLimit(null)).toBe(1)
    })
  })
})
