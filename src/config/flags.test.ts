import { describe, it, expect } from 'vitest'
import { featureFlags, isFeatureEnabled } from './flags'

describe('featureFlags', () => {
  it('should have expected default flags', () => {
    expect(featureFlags).toHaveProperty('multiStaffScheduling')
    expect(featureFlags).toHaveProperty('onlinePayments')
    expect(featureFlags).toHaveProperty('emailReminders')
    expect(featureFlags).toHaveProperty('clientPortal')
    expect(featureFlags).toHaveProperty('petPhotos')
    expect(featureFlags).toHaveProperty('inventoryManagement')
  })

  it('should have correct default values', () => {
    expect(featureFlags.multiStaffScheduling).toBe(false)
    expect(featureFlags.onlinePayments).toBe(false)
    expect(featureFlags.emailReminders).toBe(true)
    expect(featureFlags.clientPortal).toBe(true)
  })
})

describe('isFeatureEnabled', () => {
  it('should return true for enabled features', () => {
    expect(isFeatureEnabled('emailReminders')).toBe(true)
    expect(isFeatureEnabled('clientPortal')).toBe(true)
  })

  it('should return false for disabled features', () => {
    expect(isFeatureEnabled('multiStaffScheduling')).toBe(false)
    expect(isFeatureEnabled('onlinePayments')).toBe(false)
  })
})
