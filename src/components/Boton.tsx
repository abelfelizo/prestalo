import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View, type ViewStyle } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { color as COLORS, font, radius, gradient, shadowRaised } from '@/theme'

type Variante = 'primary' | 'success' | 'danger' | 'whatsapp' | 'outline' | 'neutral'

type Grad = readonly [string, string, ...string[]]
const GRAD: Partial<Record<Variante, Grad>> = {
  primary: gradient.button,
  success: gradient.buttonSuccess,
  danger: ['#F87171', '#DC2626'],
  whatsapp: ['#25D366', '#128C7E'],
}

export function Boton({
  label,
  onPress,
  icon,
  variant = 'primary',
  loading,
  disabled,
  style,
}: {
  label: string
  onPress: () => void
  icon?: keyof typeof Feather.glyphMap
  variant?: Variante
  loading?: boolean
  disabled?: boolean
  style?: ViewStyle
}) {
  const outline = variant === 'outline'
  const neutral = variant === 'neutral'
  const fg = outline ? COLORS.danger : neutral ? COLORS.ink : '#fff'
  const grad = GRAD[variant]

  const contenido = loading ? (
    <ActivityIndicator color={fg} />
  ) : (
    <View style={s.row}>
      {icon && <Feather name={icon} size={17} color={fg} />}
      <Text style={[s.text, { color: fg }]}>{label}</Text>
    </View>
  )

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      disabled={disabled || loading}
      style={[grad && shadowRaised, (disabled || loading) && { opacity: 0.5 }, style]}
    >
      {grad ? (
        <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.btn}>
          {contenido}
        </LinearGradient>
      ) : (
        <View style={[s.btn, outline ? s.outline : s.neutral]}>{contenido}</View>
      )}
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  btn: { borderRadius: radius.lg, paddingVertical: 15, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  outline: { borderWidth: 1.5, borderColor: COLORS.danger, backgroundColor: 'transparent' },
  neutral: { backgroundColor: COLORS.indigoTint },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { fontFamily: font.bodyBold, fontSize: 15 },
})
