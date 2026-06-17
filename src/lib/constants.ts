import type { ColorCartera } from '@/types'

// Paleta "Verde dinero" — moderna, fresca
export const COLORS = {
  primary: '#059669', // esmeralda
  primaryDark: '#047857',
  gold: '#F59E0B', // acento ámbar (se conserva la clave 'gold' por compatibilidad)
  accent: '#F59E0B',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#2563EB',
  bg: '#FFFFFF',
  surface: '#F0FDF4', // menta muy claro
  surfaceAlt: '#F8FAFC',
  border: '#E5E7EB',
  text: '#0F172A',
  textLight: '#64748B',
  // sombra suave reutilizable
  shadow: '#0F172A',
}

// carteras.color es un enum semántico en la BD → hex para la UI
export const COLOR_CARTERA: Record<ColorCartera, string> = {
  green: '#059669',
  amber: '#F59E0B',
  blue: '#2563EB',
  purple: '#7C3AED',
  red: '#EF4444',
}

export const MONEDAS = ['RD$', 'USD', 'EUR', 'COP', 'MXN', 'S/'] as const
