import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

// Theme types
export type ThemeName = 'mint' | 'lavender' | 'peach' | 'ocean' | 'rose' | 'sunset' | 'forest' | 'sky'

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
}

interface ThemeContextValue {
  currentTheme: ThemeName
  setTheme: (theme: ThemeName) => void
  colors: ThemeColors
}

// Color palette definitions
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
  },
}

const STORAGE_KEY = 'app-theme'

// Create context with undefined default (will be provided by ThemeProvider)
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

// All valid theme names
const validThemes: ThemeName[] = ['mint', 'lavender', 'peach', 'ocean', 'rose', 'sunset', 'forest', 'sky']

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
