import { describe, it, expect } from 'vitest'
import { cn, formatCurrency, formatDuration, formatPhone, getInitials } from './utils'

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar')
    })

    it('should handle conditional classes', () => {
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz')
    })

    it('should handle undefined values', () => {
      expect(cn('foo', undefined, 'bar')).toBe('foo bar')
    })

    it('should merge tailwind classes correctly', () => {
      expect(cn('px-2', 'px-4')).toBe('px-4')
    })
  })

  describe('formatCurrency', () => {
    it('should format currency with dollar sign', () => {
      expect(formatCurrency(100)).toBe('$100.00')
    })

    it('should format decimals', () => {
      expect(formatCurrency(99.99)).toBe('$99.99')
    })

    it('should format zero', () => {
      expect(formatCurrency(0)).toBe('$0.00')
    })

    it('should format large numbers with commas', () => {
      expect(formatCurrency(1000)).toBe('$1,000.00')
    })
  })

  describe('formatDuration', () => {
    it('should format minutes only', () => {
      expect(formatDuration(30)).toBe('30min')
    })

    it('should format hours only', () => {
      expect(formatDuration(60)).toBe('1hr')
      expect(formatDuration(120)).toBe('2hr')
    })

    it('should format hours and minutes', () => {
      expect(formatDuration(90)).toBe('1hr 30min')
      expect(formatDuration(150)).toBe('2hr 30min')
    })
  })

  describe('formatPhone', () => {
    it('should format 10-digit phone numbers', () => {
      expect(formatPhone('5551234567')).toBe('(555) 123-4567')
    })

    it('should handle already formatted numbers', () => {
      expect(formatPhone('(555) 123-4567')).toBe('(555) 123-4567')
    })

    it('should return original for invalid lengths', () => {
      expect(formatPhone('12345')).toBe('12345')
    })
  })

  describe('getInitials', () => {
    it('should get initials from full name', () => {
      expect(getInitials('John Doe')).toBe('JD')
    })

    it('should handle single name', () => {
      expect(getInitials('John')).toBe('J')
    })

    it('should limit to 2 characters', () => {
      expect(getInitials('John Middle Doe')).toBe('JM')
    })

    it('should handle lowercase', () => {
      expect(getInitials('john doe')).toBe('JD')
    })
  })
})
