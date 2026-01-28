import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { hexToRgb, luminance } from '@/lib/utils/contrast'

// Theme types
export type ThemeName = 'mint' | 'lavender' | 'peach' | 'ocean' | 'rose' | 'sunset' | 'forest' | 'sky' | 'skyButter' | 'oceanCitrus' | 'blueMango' | 'aquaSunset' | 'mintCreamsicle' | 'mintBlush'

export interface ThemeColors {
  sidebarGradient: string
  pageGradient: string
  pageGradientLight: string
  accentColor: string
  accentColorLight: string
  accentColorDark: string
  secondaryAccent: string
  inkBorder: string
  // Raw hex values for inline styles
  gradientFrom: string
  gradientVia: string
  gradientTo: string
  // Text colors for contrast on themed backgrounds
  textOnPrimary: string // Color for text on primary/accent background
  textOnAccent: string // Color for text on accentColorDark background
}

// Constants for text colors
const TEXT_DARK = '#1e293b' // ink color for light backgrounds
const TEXT_LIGHT = '#ffffff' // white for dark backgrounds

/**
 * Determines the best text color for a given background color.
 * Uses WCAG luminance calculation - if background is light (luminance > 0.5), use dark text.
 */
function getTextColorForBackground(bgColor: string): string {
  const rgb = hexToRgb(bgColor)
  const lum = luminance(rgb.r, rgb.g, rgb.b)
  // If luminance > 0.5, the background is light, so use dark text
  return lum > 0.5 ? TEXT_DARK : TEXT_LIGHT
}

interface ThemeContextValue {
  currentTheme: ThemeName
  setTheme: (theme: ThemeName) => void
  colors: ThemeColors
}

// Color palette definitions
// textOnPrimary: text color for accentColor background
// textOnAccent: text color for accentColorDark background
const themeColors: Record<ThemeName, ThemeColors> = {
  mint: {
    sidebarGradient: 'bg-gradient-to-b from-[#ecfccb] to-[#d1fae5]',
    pageGradient: 'bg-gradient-to-br from-[#ecfccb] via-[#d1fae5] to-[#fef9c3]',
    pageGradientLight: 'bg-gradient-to-br from-[#ecfccb]/30 to-[#d1fae5]/30',
    accentColor: '#d1fae5',
    accentColorLight: '#ecfccb',
    accentColorDark: '#a7f3d0',
    secondaryAccent: '#fef9c3', // lemon
    inkBorder: '#1e293b',
    gradientFrom: '#ecfccb',
    gradientVia: '#d1fae5',
    gradientTo: '#fef9c3',
    textOnPrimary: getTextColorForBackground('#d1fae5'), // light mint -> dark text
    textOnAccent: getTextColorForBackground('#a7f3d0'), // light mint -> dark text
  },
  lavender: {
    sidebarGradient: 'bg-gradient-to-b from-[#e9d5ff] to-[#ddd6fe]',
    pageGradient: 'bg-gradient-to-br from-[#e9d5ff] via-[#ddd6fe] to-[#f3e8ff]',
    pageGradientLight: 'bg-gradient-to-br from-[#e9d5ff]/30 to-[#ddd6fe]/30',
    accentColor: '#e9d5ff',
    accentColorLight: '#f3e8ff',
    accentColorDark: '#c4b5fd',
    secondaryAccent: '#ddd6fe', // soft purple
    inkBorder: '#1e293b',
    gradientFrom: '#e9d5ff',
    gradientVia: '#ddd6fe',
    gradientTo: '#f3e8ff',
    textOnPrimary: getTextColorForBackground('#e9d5ff'), // light lavender -> dark text
    textOnAccent: getTextColorForBackground('#c4b5fd'), // light purple -> dark text
  },
  peach: {
    sidebarGradient: 'bg-gradient-to-b from-[#fed7aa] to-[#fecaca]',
    pageGradient: 'bg-gradient-to-br from-[#fed7aa] via-[#fecaca] to-[#ffedd5]',
    pageGradientLight: 'bg-gradient-to-br from-[#fed7aa]/30 to-[#fecaca]/30',
    accentColor: '#fed7aa',
    accentColorLight: '#ffedd5',
    accentColorDark: '#fdba74',
    secondaryAccent: '#fecaca', // coral
    inkBorder: '#1e293b',
    gradientFrom: '#fed7aa',
    gradientVia: '#fecaca',
    gradientTo: '#ffedd5',
    textOnPrimary: getTextColorForBackground('#fed7aa'), // light peach -> dark text
    textOnAccent: getTextColorForBackground('#fdba74'), // medium peach -> dark text
  },
  ocean: {
    sidebarGradient: 'bg-gradient-to-b from-[#a5f3fc] to-[#99f6e4]',
    pageGradient: 'bg-gradient-to-br from-[#a5f3fc] via-[#99f6e4] to-[#cffafe]',
    pageGradientLight: 'bg-gradient-to-br from-[#a5f3fc]/30 to-[#99f6e4]/30',
    accentColor: '#a5f3fc',
    accentColorLight: '#cffafe',
    accentColorDark: '#67e8f9',
    secondaryAccent: '#99f6e4', // teal
    inkBorder: '#1e293b',
    gradientFrom: '#a5f3fc',
    gradientVia: '#99f6e4',
    gradientTo: '#cffafe',
    textOnPrimary: getTextColorForBackground('#a5f3fc'), // light cyan -> dark text
    textOnAccent: getTextColorForBackground('#67e8f9'), // medium cyan -> dark text
  },
  rose: {
    sidebarGradient: 'bg-gradient-to-b from-[#fecdd3] to-[#fbcfe8]',
    pageGradient: 'bg-gradient-to-br from-[#fecdd3] via-[#fbcfe8] to-[#fce7f3]',
    pageGradientLight: 'bg-gradient-to-br from-[#fecdd3]/30 to-[#fbcfe8]/30',
    accentColor: '#fecdd3',
    accentColorLight: '#fce7f3',
    accentColorDark: '#fda4af',
    secondaryAccent: '#fbcfe8', // pink
    inkBorder: '#1e293b',
    gradientFrom: '#fecdd3',
    gradientVia: '#fbcfe8',
    gradientTo: '#fce7f3',
    textOnPrimary: getTextColorForBackground('#fecdd3'), // light rose -> dark text
    textOnAccent: getTextColorForBackground('#fda4af'), // medium rose -> dark text
  },
  sunset: {
    sidebarGradient: 'bg-gradient-to-b from-[#fde68a] to-[#fed7aa]',
    pageGradient: 'bg-gradient-to-br from-[#fde68a] via-[#fed7aa] to-[#fef3c7]',
    pageGradientLight: 'bg-gradient-to-br from-[#fde68a]/30 to-[#fed7aa]/30',
    accentColor: '#fde68a',
    accentColorLight: '#fef3c7',
    accentColorDark: '#fcd34d',
    secondaryAccent: '#fed7aa', // amber
    inkBorder: '#1e293b',
    gradientFrom: '#fde68a',
    gradientVia: '#fed7aa',
    gradientTo: '#fef3c7',
    textOnPrimary: getTextColorForBackground('#fde68a'), // light yellow -> dark text
    textOnAccent: getTextColorForBackground('#fcd34d'), // medium yellow -> dark text
  },
  forest: {
    sidebarGradient: 'bg-gradient-to-b from-[#bbf7d0] to-[#a7f3d0]',
    pageGradient: 'bg-gradient-to-br from-[#bbf7d0] via-[#a7f3d0] to-[#dcfce7]',
    pageGradientLight: 'bg-gradient-to-br from-[#bbf7d0]/30 to-[#a7f3d0]/30',
    accentColor: '#bbf7d0',
    accentColorLight: '#dcfce7',
    accentColorDark: '#86efac',
    secondaryAccent: '#a7f3d0', // emerald
    inkBorder: '#1e293b',
    gradientFrom: '#bbf7d0',
    gradientVia: '#a7f3d0',
    gradientTo: '#dcfce7',
    textOnPrimary: getTextColorForBackground('#bbf7d0'), // light green -> dark text
    textOnAccent: getTextColorForBackground('#86efac'), // medium green -> dark text
  },
  sky: {
    sidebarGradient: 'bg-gradient-to-b from-[#bae6fd] to-[#e0f2fe]',
    pageGradient: 'bg-gradient-to-br from-[#bae6fd] via-[#e0f2fe] to-[#f0f9ff]',
    pageGradientLight: 'bg-gradient-to-br from-[#bae6fd]/30 to-[#e0f2fe]/30',
    accentColor: '#bae6fd',
    accentColorLight: '#e0f2fe',
    accentColorDark: '#7dd3fc',
    secondaryAccent: '#e0f2fe', // light blue
    inkBorder: '#1e293b',
    gradientFrom: '#bae6fd',
    gradientVia: '#e0f2fe',
    gradientTo: '#f0f9ff',
    textOnPrimary: getTextColorForBackground('#bae6fd'), // light blue -> dark text
    textOnAccent: getTextColorForBackground('#7dd3fc'), // medium blue -> dark text
  },
  // New vibrant palettes
  skyButter: {
    sidebarGradient: 'bg-gradient-to-b from-[#4CC9FE] to-[#37AFE1]',
    pageGradient: 'bg-gradient-to-br from-[#FFFECB] via-[#F5F4B3] to-[#4CC9FE]',
    pageGradientLight: 'bg-gradient-to-br from-[#FFFECB]/30 to-[#4CC9FE]/30',
    accentColor: '#4CC9FE',
    accentColorLight: '#FFFECB',
    accentColorDark: '#37AFE1',
    secondaryAccent: '#F5F4B3', // light yellow
    inkBorder: '#1e293b',
    gradientFrom: '#FFFECB',
    gradientVia: '#F5F4B3',
    gradientTo: '#4CC9FE',
    textOnPrimary: getTextColorForBackground('#4CC9FE'), // medium-dark blue -> check
    textOnAccent: getTextColorForBackground('#37AFE1'), // medium-dark blue -> likely white
  },
  oceanCitrus: {
    sidebarGradient: 'bg-gradient-to-b from-[#80D8C3] to-[#4DA8DA]',
    pageGradient: 'bg-gradient-to-br from-[#F5F5F5] via-[#FFD66B] to-[#80D8C3]',
    pageGradientLight: 'bg-gradient-to-br from-[#F5F5F5]/30 to-[#80D8C3]/30',
    accentColor: '#80D8C3',
    accentColorLight: '#F5F5F5',
    accentColorDark: '#4DA8DA',
    secondaryAccent: '#FFD66B', // gold
    inkBorder: '#1e293b',
    gradientFrom: '#F5F5F5',
    gradientVia: '#FFD66B',
    gradientTo: '#80D8C3',
    textOnPrimary: getTextColorForBackground('#80D8C3'), // medium teal -> dark text
    textOnAccent: getTextColorForBackground('#4DA8DA'), // medium blue -> check
  },
  blueMango: {
    sidebarGradient: 'bg-gradient-to-b from-[#FFDE63] to-[#799EFF]',
    pageGradient: 'bg-gradient-to-br from-[#FEFFC4] via-[#FFDE63] to-[#799EFF]',
    pageGradientLight: 'bg-gradient-to-br from-[#FEFFC4]/30 to-[#799EFF]/30',
    accentColor: '#FFDE63',
    accentColorLight: '#FEFFC4',
    accentColorDark: '#799EFF',
    secondaryAccent: '#FFBC4C', // orange
    inkBorder: '#1e293b',
    gradientFrom: '#FEFFC4',
    gradientVia: '#FFDE63',
    gradientTo: '#799EFF',
    textOnPrimary: getTextColorForBackground('#FFDE63'), // yellow -> dark text
    textOnAccent: getTextColorForBackground('#799EFF'), // light periwinkle -> check
  },
  aquaSunset: {
    sidebarGradient: 'bg-gradient-to-b from-[#FEEE91] to-[#8CE4FF]',
    pageGradient: 'bg-gradient-to-br from-[#8CE4FF] via-[#FEEE91] to-[#FFA239]',
    pageGradientLight: 'bg-gradient-to-br from-[#8CE4FF]/30 to-[#FFA239]/30',
    accentColor: '#FEEE91',
    accentColorLight: '#8CE4FF',
    accentColorDark: '#FFA239',
    secondaryAccent: '#FF5656', // coral
    inkBorder: '#1e293b',
    gradientFrom: '#8CE4FF',
    gradientVia: '#FEEE91',
    gradientTo: '#FFA239',
    textOnPrimary: getTextColorForBackground('#FEEE91'), // very light yellow -> dark text
    textOnAccent: getTextColorForBackground('#FFA239'), // orange -> dark text
  },
  mintCreamsicle: {
    sidebarGradient: 'bg-gradient-to-b from-[#6AECE1] to-[#26CCC2]',
    pageGradient: 'bg-gradient-to-br from-[#6AECE1] via-[#FFF57E] to-[#FFB76C]',
    pageGradientLight: 'bg-gradient-to-br from-[#6AECE1]/30 to-[#FFB76C]/30',
    accentColor: '#6AECE1',
    accentColorLight: '#FFF57E',
    accentColorDark: '#26CCC2',
    secondaryAccent: '#FFB76C', // orange
    inkBorder: '#1e293b',
    gradientFrom: '#6AECE1',
    gradientVia: '#FFF57E',
    gradientTo: '#FFB76C',
    textOnPrimary: getTextColorForBackground('#6AECE1'), // medium teal -> dark text
    textOnAccent: getTextColorForBackground('#26CCC2'), // medium teal -> check
  },
  mintBlush: {
    sidebarGradient: 'bg-gradient-to-b from-[#F0FFDF] to-[#A8DF8E]',
    pageGradient: 'bg-gradient-to-br from-[#F0FFDF] via-[#FFD8DF] to-[#FFAAB8]',
    pageGradientLight: 'bg-gradient-to-br from-[#F0FFDF]/30 to-[#FFAAB8]/30',
    accentColor: '#FFD8DF',
    accentColorLight: '#F0FFDF',
    accentColorDark: '#A8DF8E',
    secondaryAccent: '#FFAAB8', // rose
    inkBorder: '#1e293b',
    gradientFrom: '#F0FFDF',
    gradientVia: '#FFD8DF',
    gradientTo: '#FFAAB8',
    textOnPrimary: getTextColorForBackground('#FFD8DF'), // light pink -> dark text
    textOnAccent: getTextColorForBackground('#A8DF8E'), // light mint -> dark text
  },
}

const STORAGE_KEY = 'app-theme'

// Create context with undefined default (will be provided by ThemeProvider)
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

// All valid theme names
const validThemes: ThemeName[] = ['mint', 'lavender', 'peach', 'ocean', 'rose', 'sunset', 'forest', 'sky', 'skyButter', 'oceanCitrus', 'blueMango', 'aquaSunset', 'mintCreamsicle', 'mintBlush']

// Helper to get initial theme from localStorage
function getInitialTheme(): ThemeName {
  if (typeof window === 'undefined') return 'mint'

  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && validThemes.includes(stored as ThemeName)) {
    return stored as ThemeName
  }
  return 'mint'
}

// ThemeProvider component
interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [currentTheme, setCurrentTheme] = useState<ThemeName>(getInitialTheme)

  // Persist theme to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, currentTheme)
  }, [currentTheme])

  // Apply CSS variables to document root for components that need them
  useEffect(() => {
    const colors = themeColors[currentTheme]
    const root = document.documentElement

    root.style.setProperty('--accent-color', colors.accentColor)
    root.style.setProperty('--accent-color-light', colors.accentColorLight)
    root.style.setProperty('--accent-color-dark', colors.accentColorDark)
    root.style.setProperty('--secondary-accent', colors.secondaryAccent)
    root.style.setProperty('--ink-border', colors.inkBorder)
    root.style.setProperty('--gradient-from', colors.gradientFrom)
    root.style.setProperty('--gradient-via', colors.gradientVia)
    root.style.setProperty('--gradient-to', colors.gradientTo)
    root.style.setProperty('--text-on-primary', colors.textOnPrimary)
    root.style.setProperty('--text-on-accent', colors.textOnAccent)
  }, [currentTheme])

  const setTheme = (theme: ThemeName) => {
    setCurrentTheme(theme)
  }

  const value: ThemeContextValue = {
    currentTheme,
    setTheme,
    colors: themeColors[currentTheme],
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

// Custom hook to use theme context
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  return context
}

// Export theme colors for direct access if needed
export { themeColors }
