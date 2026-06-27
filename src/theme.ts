// Tokens de diseño del rediseño visual de Kuotas.
// Fuente: design_handoff_kuotas_rediseno. Conserva la paleta índigo existente.
// Las pantallas deben consumir estos tokens en vez de hardcodear hex/tamaños.

export const color = {
  // Índigo / marca
  primary: '#4F46E5',
  primaryDeep: '#312E81',
  primaryDark: '#1E1B4B',
  violet: '#6D28D9',
  violetLight: '#7C3AED',
  indigo600: '#6366F1',

  // Acento
  cyan: '#06B6D4',
  cyanLight: '#22D3EE',

  // Semánticos
  success: '#10B981',
  successDark: '#059669',
  warning: '#F59E0B',
  danger: '#EF4444',
  whatsapp: '#25D366',

  // Neutros (slate)
  ink: '#0F172A',
  muted: '#64748B',
  faint: '#94A3B8',
  line: '#F1F5F9',
  surface: '#FFFFFF',
  bg: '#F8FAFC',

  // Tintes suaves
  indigoTint: '#EEF2FF',
  indigoTint2: '#E0E7FF',
  successTint: '#ECFDF5',
  warningTint: '#FFFBEB',
  dangerTint: '#FEF2F2',
  violetTint: '#F5F3FF',
}

// Nombres de fuente tal como los registra @expo-google-fonts.
export const font = {
  display: 'Sora_800ExtraBold',
  displaySemi: 'Sora_700Bold',
  bodyBold: 'PlusJakartaSans_700Bold',
  bodySemi: 'PlusJakartaSans_600SemiBold',
  body: 'PlusJakartaSans_500Medium',
} as const

export const type = {
  hero: { fontFamily: font.display, fontSize: 34, letterSpacing: -1 },
  h1: { fontFamily: font.display, fontSize: 24, letterSpacing: -0.6 },
  h2: { fontFamily: font.displaySemi, fontSize: 14 },
  amount: { fontFamily: font.display, fontSize: 14 },
  bodyLg: { fontFamily: font.bodySemi, fontSize: 14 },
  body: { fontFamily: font.body, fontSize: 13 },
  label: { fontFamily: font.bodyBold, fontSize: 11 },
  caption: { fontFamily: font.body, fontSize: 11, color: color.faint },
} as const

export const radius = { sm: 11, md: 14, lg: 16, xl: 18, xxl: 22, card: 24, sheet: 30, phone: 46 }
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 18, xxl: 22 }

export const shadowCard = {
  shadowColor: '#0F172A',
  shadowOpacity: 0.05,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
}
export const shadowRaised = {
  shadowColor: '#4F46E5',
  shadowOpacity: 0.4,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 8 },
  elevation: 6,
}

// Degradados frecuentes (para expo-linear-gradient).
export const gradient = {
  button: ['#6366F1', '#4F46E5'] as const,
  buttonSuccess: ['#10B981', '#059669'] as const,
  hero: ['#312E81', '#4F46E5', '#6D28D9'] as const,
  profile: ['#4F46E5', '#6D28D9'] as const,
}

// Lista de fuentes para cargar en el _layout raíz.
export { Sora_700Bold, Sora_800ExtraBold } from '@expo-google-fonts/sora'
export {
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans'
