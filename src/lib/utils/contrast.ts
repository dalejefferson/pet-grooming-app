/**
 * WCAG Contrast Ratio Utility
 * Implements WCAG 2.1 contrast ratio calculations for accessibility compliance.
 */

/**
 * Parse a hex color string to RGB components.
 * Supports both 3-digit (#RGB) and 6-digit (#RRGGBB) formats.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  // Remove leading # if present
  const cleanHex = hex.replace(/^#/, '')

  let r: number
  let g: number
  let b: number

  if (cleanHex.length === 3) {
    // Expand 3-digit hex to 6-digit
    r = parseInt(cleanHex[0] + cleanHex[0], 16)
    g = parseInt(cleanHex[1] + cleanHex[1], 16)
    b = parseInt(cleanHex[2] + cleanHex[2], 16)
  } else if (cleanHex.length === 6) {
    r = parseInt(cleanHex.slice(0, 2), 16)
    g = parseInt(cleanHex.slice(2, 4), 16)
    b = parseInt(cleanHex.slice(4, 6), 16)
  } else {
    throw new Error(`Invalid hex color: ${hex}`)
  }

  return { r, g, b }
}

/**
 * Calculate the relative luminance of a color per WCAG 2.1 specification.
 * @see https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 *
 * @param r - Red component (0-255)
 * @param g - Green component (0-255)
 * @param b - Blue component (0-255)
 * @returns Relative luminance value between 0 and 1
 */
export function luminance(r: number, g: number, b: number): number {
  // Convert to sRGB (0-1 range)
  const sR = r / 255
  const sG = g / 255
  const sB = b / 255

  // Apply gamma correction
  // If value <= 0.04045, divide by 12.92
  // Otherwise, apply ((value + 0.055) / 1.055) ^ 2.4
  const linearize = (value: number): number => {
    return value <= 0.04045
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4)
  }

  const R = linearize(sR)
  const G = linearize(sG)
  const B = linearize(sB)

  // Calculate luminance using the WCAG formula
  return 0.2126 * R + 0.7152 * G + 0.0722 * B
}

/**
 * Calculate the contrast ratio between two colors per WCAG 2.1.
 * @see https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 *
 * @param fg - Foreground color in hex format
 * @param bg - Background color in hex format
 * @returns Contrast ratio (1:1 to 21:1)
 */
export function contrastRatio(fg: string, bg: string): number {
  const fgRgb = hexToRgb(fg)
  const bgRgb = hexToRgb(bg)

  const fgLuminance = luminance(fgRgb.r, fgRgb.g, fgRgb.b)
  const bgLuminance = luminance(bgRgb.r, bgRgb.g, bgRgb.b)

  // L1 is the lighter of the two luminances
  const L1 = Math.max(fgLuminance, bgLuminance)
  const L2 = Math.min(fgLuminance, bgLuminance)

  // Contrast ratio formula: (L1 + 0.05) / (L2 + 0.05)
  return (L1 + 0.05) / (L2 + 0.05)
}

/**
 * Check if two colors meet WCAG contrast requirements.
 *
 * WCAG 2.1 Success Criteria:
 * - Level AA: Minimum contrast ratio of 4.5:1 for normal text
 * - Level AAA: Enhanced contrast ratio of 7:1 for normal text
 *
 * @param fg - Foreground color in hex format
 * @param bg - Background color in hex format
 * @param level - WCAG conformance level ('AA' or 'AAA', defaults to 'AA')
 * @returns true if the contrast ratio meets the specified level
 */
export function meetsContrast(
  fg: string,
  bg: string,
  level: 'AA' | 'AAA' = 'AA'
): boolean {
  const ratio = contrastRatio(fg, bg)
  const threshold = level === 'AAA' ? 7 : 4.5
  return ratio >= threshold
}
