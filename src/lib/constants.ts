import type { ColorCartera } from '@/types'

// Paleta de la app
export const COLORS = {
  primary: '#1a1a2e',
  gold: '#C9A84C',
  success: '#2e7d32',
  danger: '#c62828',
  warning: '#e65100',
  info: '#1565c0',
  bg: '#ffffff',
  surface: '#f8f8f8',
  border: '#f0f0f0',
  text: '#111111',
  textLight: '#888888',
}

// carteras.color es un enum semántico en la BD → hex para la UI
export const COLOR_CARTERA: Record<ColorCartera, string> = {
  green: '#2e7d32',
  amber: '#C9A84C',
  blue: '#1565c0',
  purple: '#4527a0',
  red: '#c62828',
}

export const MONEDAS = ['RD$', 'USD', 'EUR', 'COP', 'MXN', 'S/'] as const
