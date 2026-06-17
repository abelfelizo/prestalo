import type { ColorCartera } from '@/types'

// Paleta "Índigo premium" — fintech moderno (acento cian)
export const COLORS = {
  primary: '#4F46E5', // índigo
  primaryDark: '#4338CA',
  gold: '#06B6D4', // acento cian (se conserva la clave 'gold' por compatibilidad)
  accent: '#06B6D4',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#2563EB',
  bg: '#FFFFFF',
  surface: '#EEF2FF', // índigo muy claro
  surfaceAlt: '#F8FAFC',
  border: '#E5E7EB',
  text: '#0F172A',
  textLight: '#64748B',
  // glass / sombra
  shadow: '#0F172A',
  glassTint: 'light' as const,
}

// Degradados (para LinearGradient: start→end)
export const GRADIENTS = {
  hero: ['#4F46E5', '#7C3AED'] as const, // índigo → violeta
  primary: ['#6366F1', '#4F46E5'] as const,
  accent: ['#22D3EE', '#0891B2'] as const, // cian
  success: ['#34D399', '#059669'] as const,
  danger: ['#F87171', '#DC2626'] as const,
  authBg: ['#312E81', '#4F46E5', '#6D28D9'] as const, // fondo de auth, profundo
}

// carteras.color es un enum semántico en la BD → hex para la UI
export const COLOR_CARTERA: Record<ColorCartera, string> = {
  green: '#10B981',
  amber: '#F59E0B',
  blue: '#4F46E5',
  purple: '#7C3AED',
  red: '#EF4444',
}

export const MONEDAS = ['RD$', 'USD', 'EUR', 'COP', 'MXN', 'S/'] as const
