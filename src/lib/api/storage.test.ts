import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getStorageKey, getFromStorage, generateId, delay } from '@/modules/database/storage/localStorage'

describe('storage utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getStorageKey', () => {
    it('should prefix keys with pet_grooming_', () => {
      expect(getStorageKey('test')).toBe('pet_grooming_test')
      expect(getStorageKey('appointments')).toBe('pet_grooming_appointments')
    })
  })

  describe('getFromStorage', () => {
    it('should return default value when localStorage throws', () => {
      const defaultValue = { test: 'value' }
      const result = getFromStorage('nonexistent', defaultValue)
      expect(result).toEqual(defaultValue)
    })
  })

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
      expect(typeof id1).toBe('string')
      expect(id1.length).toBeGreaterThan(0)
    })

    it('should include timestamp in ID', () => {
      const id = generateId()
      const parts = id.split('-')
      expect(parts.length).toBe(2)
      expect(Number(parts[0])).toBeGreaterThan(0)
    })
  })

  describe('delay', () => {
    it('should resolve after specified time', async () => {
      const start = Date.now()
      await delay(50)
      const elapsed = Date.now() - start
      expect(elapsed).toBeGreaterThanOrEqual(45)
    })

    it('should use default delay of 100ms', async () => {
      const start = Date.now()
      await delay()
      const elapsed = Date.now() - start
      expect(elapsed).toBeGreaterThanOrEqual(95)
    })
  })
})
