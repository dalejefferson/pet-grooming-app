import { describe, it, expect } from 'vitest'
import { hexToRgb, luminance, contrastRatio, meetsContrast } from './contrast'

describe('contrast', () => {
  describe('hexToRgb', () => {
    it('should parse black (#000000)', () => {
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 })
    })

    it('should parse white (#ffffff)', () => {
      expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 })
    })

    it('should parse 3-digit hex (#fff)', () => {
      expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 })
    })

    it('should parse 3-digit hex (#000)', () => {
      expect(hexToRgb('#000')).toEqual({ r: 0, g: 0, b: 0 })
    })

    it('should parse a specific color (#1e293b)', () => {
      expect(hexToRgb('#1e293b')).toEqual({ r: 30, g: 41, b: 59 })
    })

    it('should parse red (#ff0000)', () => {
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 })
    })

    it('should parse 3-digit hex (#f00) as red', () => {
      expect(hexToRgb('#f00')).toEqual({ r: 255, g: 0, b: 0 })
    })

    it('should work without the # prefix', () => {
      expect(hexToRgb('ffffff')).toEqual({ r: 255, g: 255, b: 255 })
    })

    it('should handle uppercase hex', () => {
      expect(hexToRgb('#AABBCC')).toEqual({ r: 170, g: 187, b: 204 })
    })

    it('should throw an error for invalid hex length', () => {
      expect(() => hexToRgb('#12345')).toThrow('Invalid hex color')
    })

    it('should throw an error for single character', () => {
      expect(() => hexToRgb('#f')).toThrow('Invalid hex color')
    })

    it('should throw an error for empty string', () => {
      expect(() => hexToRgb('')).toThrow('Invalid hex color')
    })
  })

  describe('luminance', () => {
    it('should return 0 for black', () => {
      expect(luminance(0, 0, 0)).toBe(0)
    })

    it('should return 1 for white', () => {
      expect(luminance(255, 255, 255)).toBeCloseTo(1, 4)
    })

    it('should return correct luminance for pure red', () => {
      // Red coefficient is 0.2126
      const result = luminance(255, 0, 0)
      expect(result).toBeCloseTo(0.2126, 3)
    })

    it('should return correct luminance for pure green', () => {
      // Green coefficient is 0.7152
      const result = luminance(0, 255, 0)
      expect(result).toBeCloseTo(0.7152, 3)
    })

    it('should return correct luminance for pure blue', () => {
      // Blue coefficient is 0.0722
      const result = luminance(0, 0, 255)
      expect(result).toBeCloseTo(0.0722, 3)
    })

    it('should return a value between 0 and 1 for mid-gray', () => {
      const result = luminance(128, 128, 128)
      expect(result).toBeGreaterThan(0)
      expect(result).toBeLessThan(1)
    })

    it('should return higher luminance for lighter colors', () => {
      const lightGray = luminance(200, 200, 200)
      const darkGray = luminance(50, 50, 50)
      expect(lightGray).toBeGreaterThan(darkGray)
    })
  })

  describe('contrastRatio', () => {
    it('should return 21 for black on white', () => {
      const ratio = contrastRatio('#000000', '#ffffff')
      expect(ratio).toBeCloseTo(21, 0)
    })

    it('should return 21 for white on black (order independent)', () => {
      const ratio = contrastRatio('#ffffff', '#000000')
      expect(ratio).toBeCloseTo(21, 0)
    })

    it('should return 1 for same color', () => {
      const ratio = contrastRatio('#ff0000', '#ff0000')
      expect(ratio).toBeCloseTo(1, 4)
    })

    it('should return 1 for black on black', () => {
      const ratio = contrastRatio('#000000', '#000000')
      expect(ratio).toBeCloseTo(1, 4)
    })

    it('should return 1 for white on white', () => {
      const ratio = contrastRatio('#ffffff', '#ffffff')
      expect(ratio).toBeCloseTo(1, 4)
    })

    it('should handle 3-digit hex colors', () => {
      const ratio = contrastRatio('#000', '#fff')
      expect(ratio).toBeCloseTo(21, 0)
    })

    it('should return a ratio between 1 and 21 for different colors', () => {
      const ratio = contrastRatio('#1e293b', '#ffffff')
      expect(ratio).toBeGreaterThan(1)
      expect(ratio).toBeLessThanOrEqual(21)
    })

    it('should have higher contrast for more different colors', () => {
      const highContrast = contrastRatio('#000000', '#ffffff')
      const lowContrast = contrastRatio('#666666', '#999999')
      expect(highContrast).toBeGreaterThan(lowContrast)
    })
  })

  describe('meetsContrast', () => {
    it('should pass AA (4.5:1) for black on white', () => {
      expect(meetsContrast('#000000', '#ffffff', 'AA')).toBe(true)
    })

    it('should pass AAA (7:1) for black on white', () => {
      expect(meetsContrast('#000000', '#ffffff', 'AAA')).toBe(true)
    })

    it('should fail AA for same color', () => {
      expect(meetsContrast('#888888', '#888888', 'AA')).toBe(false)
    })

    it('should default to AA level when no level specified', () => {
      // Black on white should pass AA by default
      expect(meetsContrast('#000000', '#ffffff')).toBe(true)
    })

    it('should fail AA for low-contrast color pairs', () => {
      // Light gray on white has very low contrast
      expect(meetsContrast('#cccccc', '#ffffff', 'AA')).toBe(false)
    })

    it('should pass AA but fail AAA for medium-contrast pairs', () => {
      // Dark gray on white: ~5.7:1 ratio (passes 4.5 AA, fails 7 AAA)
      expect(meetsContrast('#666666', '#ffffff', 'AA')).toBe(true)
      expect(meetsContrast('#666666', '#ffffff', 'AAA')).toBe(false)
    })

    it('should pass AA for the ink color on white background', () => {
      // #1e293b (ink) on white - should be high contrast
      expect(meetsContrast('#1e293b', '#ffffff', 'AA')).toBe(true)
    })

    it('should handle colors regardless of fg/bg order', () => {
      const result1 = meetsContrast('#000000', '#ffffff', 'AA')
      const result2 = meetsContrast('#ffffff', '#000000', 'AA')
      expect(result1).toBe(result2)
    })
  })
})
