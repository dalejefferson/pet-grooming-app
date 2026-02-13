import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { hexToRgb, luminance } from '@/lib/utils/contrast'

// Theme types
export type ThemeName = 'mint' | 'lavender' | 'peach' | 'ocean' | 'rose' | 'sunset' | 'forest' | 'sky' | 'skyButter' | 'oceanCitrus' | 'blueMango' | 'aquaSunset' | 'mintCreamsicle' | 'mintBlush' | 'plum' | 'nautical' | 'sage' | 'slate' | 'taupe' | 'olive' | 'terra'

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
  textOnSecondary: string // Color for text on secondaryAccent background
  textOnAccentLight: string // Color for text on accentColorLight background
  textOnSidebar: string // Color for text on sidebar gradient background
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

/**
 * Determines text color for sidebar gradient by extracting hex colors
 * from the Tailwind gradient class and using the darkest color.
 */
function getSidebarTextColor(sidebarGradient: string): string {
  const matches = sidebarGradient.match(/#[0-9a-fA-F]{6}/g)
  if (!matches || matches.length === 0) return TEXT_DARK

  let darkestLum = 1
  let darkestColor = matches[0]
  for (const color of matches) {
    const rgb = hexToRgb(color)
    const lum = luminance(rgb.r, rgb.g, rgb.b)
    if (lum < darkestLum) {
      darkestLum = lum
      darkestColor = color
    }
  }

  return getTextColorForBackground(darkestColor)
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
    textOnSecondary: getTextColorForBackground('#fef9c3'),
    textOnAccentLight: getTextColorForBackground('#ecfccb'),
    textOnSidebar: getSidebarTextColor('bg-gradient-to-b from-[#ecfccb] to-[#d1fae5]'),
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
    textOnSecondary: getTextColorForBackground('#ddd6fe'),
    textOnAccentLight: getTextColorForBackground('#f3e8ff'),
    textOnSidebar: getSidebarTextColor('bg-gradient-to-b from-[#e9d5ff] to-[#ddd6fe]'),
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
    textOnSecondary: getTextColorForBackground('#fecaca'),
    textOnAccentLight: getTextColorForBackground('#ffedd5'),
    textOnSidebar: getSidebarTextColor('bg-gradient-to-b from-[#fed7aa] to-[#fecaca]'),
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
    textOnSecondary: getTextColorForBackground('#99f6e4'),
    textOnAccentLight: getTextColorForBackground('#cffafe'),
    textOnSidebar: getSidebarTextColor('bg-gradient-to-b from-[#a5f3fc] to-[#99f6e4]'),
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
    textOnSecondary: getTextColorForBackground('#fbcfe8'),
    textOnAccentLight: getTextColorForBackground('#fce7f3'),
    textOnSidebar: getSidebarTextColor('bg-gradient-to-b from-[#fecdd3] to-[#fbcfe8]'),
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
    textOnSecondary: getTextColorForBackground('#fed7aa'),
    textOnAccentLight: getTextColorForBackground('#fef3c7'),
    textOnSidebar: getSidebarTextColor('bg-gradient-to-b from-[#fde68a] to-[#fed7aa]'),
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
    textOnSecondary: getTextColorForBackground('#a7f3d0'),
    textOnAccentLight: getTextColorForBackground('#dcfce7'),
    textOnSidebar: getSidebarTextColor('bg-gradient-to-b from-[#bbf7d0] to-[#a7f3d0]'),
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
    textOnSecondary: getTextColorForBackground('#e0f2fe'),
    textOnAccentLight: getTextColorForBackground('#e0f2fe'),
    textOnSidebar: getSidebarTextColor('bg-gradient-to-b from-[#bae6fd] to-[#e0f2fe]'),
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
    textOnPrimary: getTextColorForBackground('#4CC9FE'),
    textOnAccent: getTextColorForBackground('#37AFE1'),
    textOnSecondary: getTextColorForBackground('#F5F4B3'),
    textOnAccentLight: getTextColorForBackground('#FFFECB'),
    textOnSidebar: getSidebarTextColor('bg-gradient-to-b from-[#4CC9FE] to-[#37AFE1]'),
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
    textOnPrimary: getTextColorForBackground('#80D8C3'),
    textOnAccent: getTextColorForBackground('#4DA8DA'),
    textOnSecondary: getTextColorForBackground('#FFD66B'),
    textOnAccentLight: getTextColorForBackground('#F5F5F5'),
    textOnSidebar: getSidebarTextColor('bg-gradient-to-b from-[#80D8C3] to-[#4DA8DA]'),
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
    textOnPrimary: getTextColorForBackground('#FFDE63'),
    textOnAccent: getTextColorForBackground('#799EFF'),
    textOnSecondary: getTextColorForBackground('#FFBC4C'),
    textOnAccentLight: getTextColorForBackground('#FEFFC4'),
    textOnSidebar: getSidebarTextColor('bg-gradient-to-b from-[#FFDE63] to-[#799EFF]'),
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
    textOnPrimary: getTextColorForBackground('#FEEE91'),
    textOnAccent: getTextColorForBackground('#FFA239'),
    textOnSecondary: getTextColorForBackground('#FF5656'),
    textOnAccentLight: getTextColorForBackground('#8CE4FF'),
    textOnSidebar: getSidebarTextColor('bg-gradient-to-b from-[#FEEE91] to-[#8CE4FF]'),
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
    textOnPrimary: getTextColorForBackground('#6AECE1'),
    textOnAccent: getTextColorForBackground('#26CCC2'),
    textOnSecondary: getTextColorForBackground('#FFB76C'),
    textOnAccentLight: getTextColorForBackground('#FFF57E'),
    textOnSidebar: getSidebarTextColor('bg-gradient-to-b from-[#6AECE1] to-[#26CCC2]'),
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
    textOnPrimary: getTextColorForBackground('#FFD8DF'),
    textOnAccent: getTextColorForBackground('#A8DF8E'),
    textOnSecondary: getTextColorForBackground('#FFAAB8'),
    textOnAccentLight: getTextColorForBackground('#F0FFDF'),
    textOnSidebar: getSidebarTextColor('bg-gradient-to-b from-[#F0FFDF] to-[#A8DF8E]'),
  },
  // ColorHunt palettes
  plum: {
    sidebarGradient: 'bg-gradient-to-b from-[#4F1C51] to-[#210F37]',
    pageGradient: 'bg-gradient-to-br from-[#DCA06D] via-[#A55B4B] to-[#4F1C51]',
    pageGradientLight: 'bg-gradient-to-br from-[#DCA06D]/30 to-[#4F1C51]/30',
    accentColor: '#DCA06D',
    accentColorLight: '#DCA06D',
    accentColorDark: '#A55B4B',
    secondaryAccent: '#4F1C51',
    inkBorder: '#1e293b',
    gradientFrom: '#DCA06D',
    gradientVia: '#A55B4B',
    gradientTo: '#4F1C51',
    textOnPrimary: getTextColorForBackground('#DCA06D'),
    textOnAccent: getTextColorForBackground('#A55B4B'),
    textOnSecondary: getTextColorForBackground('#4F1C51'),
    textOnAccentLight: getTextColorForBackground('#DCA06D'),
    textOnSidebar: getSidebarTextColor('bg-gradient-to-b from-[#4F1C51] to-[#210F37]'),
  },
  nautical: {
    sidebarGradient: 'bg-gradient-to-b from-[#234C6A] to-[#1B3C53]',
    pageGradient: 'bg-gradient-to-br from-[#D2C1B6] via-[#456882] to-[#234C6A]',
    pageGradientLight: 'bg-gradient-to-br from-[#D2C1B6]/30 to-[#456882]/30',
    accentColor: '#D2C1B6',
    accentColorLight: '#D2C1B6',
    accentColorDark: '#456882',
    secondaryAccent: '#234C6A',
    inkBorder: '#1e293b',
    gradientFrom: '#D2C1B6',
    gradientVia: '#456882',
    gradientTo: '#234C6A',
    textOnPrimary: getTextColorForBackground('#D2C1B6'),
    textOnAccent: getTextColorForBackground('#456882'),
    textOnSecondary: getTextColorForBackground('#234C6A'),
    textOnAccentLight: getTextColorForBackground('#D2C1B6'),
    textOnSidebar: getSidebarTextColor('bg-gradient-to-b from-[#234C6A] to-[#1B3C53]'),
  },
  sage: {
    sidebarGradient: 'bg-gradient-to-b from-[#5D866C] to-[#C2A68C]',
    pageGradient: 'bg-gradient-to-br from-[#F5F5F0] via-[#E6D8C3] to-[#5D866C]',
    pageGradientLight: 'bg-gradient-to-br from-[#F5F5F0]/30 to-[#E6D8C3]/30',
    accentColor: '#E6D8C3',
    accentColorLight: '#F5F5F0',
    accentColorDark: '#5D866C',
    secondaryAccent: '#C2A68C',
    inkBorder: '#1e293b',
    gradientFrom: '#F5F5F0',
    gradientVia: '#E6D8C3',
    gradientTo: '#5D866C',
    textOnPrimary: getTextColorForBackground('#E6D8C3'),
    textOnAccent: getTextColorForBackground('#5D866C'),
    textOnSecondary: getTextColorForBackground('#C2A68C'),
    textOnAccentLight: getTextColorForBackground('#F5F5F0'),
    textOnSidebar: getSidebarTextColor('bg-gradient-to-b from-[#5D866C] to-[#C2A68C]'),
  },
  slate: {
    sidebarGradient: 'bg-gradient-to-b from-[#435663] to-[#313647]',
    pageGradient: 'bg-gradient-to-br from-[#FFF8D4] via-[#A3B087] to-[#435663]',
    pageGradientLight: 'bg-gradient-to-br from-[#FFF8D4]/30 to-[#A3B087]/30',
    accentColor: '#A3B087',
    accentColorLight: '#FFF8D4',
    accentColorDark: '#435663',
    secondaryAccent: '#FFF8D4',
    inkBorder: '#1e293b',
    gradientFrom: '#FFF8D4',
    gradientVia: '#A3B087',
    gradientTo: '#435663',
    textOnPrimary: getTextColorForBackground('#A3B087'),
    textOnAccent: getTextColorForBackground('#435663'),
    textOnSecondary: getTextColorForBackground('#FFF8D4'),
    textOnAccentLight: getTextColorForBackground('#FFF8D4'),
    textOnSidebar: getSidebarTextColor('bg-gradient-to-b from-[#435663] to-[#313647]'),
  },
  taupe: {
    sidebarGradient: 'bg-gradient-to-b from-[#A18D6D] to-[#703B3B]',
    pageGradient: 'bg-gradient-to-br from-[#9BB4C0] via-[#E1D0B3] to-[#A18D6D]',
    pageGradientLight: 'bg-gradient-to-br from-[#9BB4C0]/30 to-[#E1D0B3]/30',
    accentColor: '#E1D0B3',
    accentColorLight: '#9BB4C0',
    accentColorDark: '#A18D6D',
    secondaryAccent: '#703B3B',
    inkBorder: '#1e293b',
    gradientFrom: '#9BB4C0',
    gradientVia: '#E1D0B3',
    gradientTo: '#A18D6D',
    textOnPrimary: getTextColorForBackground('#E1D0B3'),
    textOnAccent: getTextColorForBackground('#A18D6D'),
    textOnSecondary: getTextColorForBackground('#703B3B'),
    textOnAccentLight: getTextColorForBackground('#9BB4C0'),
    textOnSidebar: getSidebarTextColor('bg-gradient-to-b from-[#A18D6D] to-[#703B3B]'),
  },
  olive: {
    sidebarGradient: 'bg-gradient-to-b from-[#A1BC98] to-[#778873]',
    pageGradient: 'bg-gradient-to-br from-[#F1F3E0] via-[#D2DCB6] to-[#A1BC98]',
    pageGradientLight: 'bg-gradient-to-br from-[#F1F3E0]/30 to-[#D2DCB6]/30',
    accentColor: '#D2DCB6',
    accentColorLight: '#F1F3E0',
    accentColorDark: '#A1BC98',
    secondaryAccent: '#778873',
    inkBorder: '#1e293b',
    gradientFrom: '#F1F3E0',
    gradientVia: '#D2DCB6',
    gradientTo: '#A1BC98',
    textOnPrimary: getTextColorForBackground('#D2DCB6'),
    textOnAccent: getTextColorForBackground('#A1BC98'),
    textOnSecondary: getTextColorForBackground('#778873'),
    textOnAccentLight: getTextColorForBackground('#F1F3E0'),
    textOnSidebar: getSidebarTextColor('bg-gradient-to-b from-[#A1BC98] to-[#778873]'),
  },
  terra: {
    sidebarGradient: 'bg-gradient-to-b from-[#94A378] to-[#2D3C59]',
    pageGradient: 'bg-gradient-to-br from-[#94A378] via-[#E5BA41] to-[#D1855C]',
    pageGradientLight: 'bg-gradient-to-br from-[#94A378]/30 to-[#E5BA41]/30',
    accentColor: '#E5BA41',
    accentColorLight: '#E5BA41',
    accentColorDark: '#D1855C',
    secondaryAccent: '#94A378',
    inkBorder: '#1e293b',
    gradientFrom: '#94A378',
    gradientVia: '#E5BA41',
    gradientTo: '#D1855C',
    textOnPrimary: getTextColorForBackground('#E5BA41'),
    textOnAccent: getTextColorForBackground('#D1855C'),
    textOnSecondary: getTextColorForBackground('#94A378'),
    textOnAccentLight: getTextColorForBackground('#E5BA41'),
    textOnSidebar: getSidebarTextColor('bg-gradient-to-b from-[#94A378] to-[#2D3C59]'),
  },
}

const STORAGE_KEY = 'app-theme'

// Create context with undefined default (will be provided by ThemeProvider)
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

// All valid theme names
const validThemes: ThemeName[] = ['mint', 'lavender', 'peach', 'ocean', 'rose', 'sunset', 'forest', 'sky', 'skyButter', 'oceanCitrus', 'blueMango', 'aquaSunset', 'mintCreamsicle', 'mintBlush', 'plum', 'nautical', 'sage', 'slate', 'taupe', 'olive', 'terra']

// Helper to get initial theme from localStorage
function getInitialTheme(): ThemeName {
  if (typeof window === 'undefined') return 'mint'

  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && validThemes.includes(stored as ThemeName)) {
    return stored as ThemeName
  }
  return 'blueMango'
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
    root.style.setProperty('--text-on-secondary', colors.textOnSecondary)
    root.style.setProperty('--text-on-accent-light', colors.textOnAccentLight)
    root.style.setProperty('--text-on-sidebar', colors.textOnSidebar)
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
// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }

  return context
}

// Export theme colors and valid themes for direct access if needed
// eslint-disable-next-line react-refresh/only-export-components
export { themeColors, validThemes }
