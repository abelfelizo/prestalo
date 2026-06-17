import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View, type ViewStyle } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { COLORS, GRADIENTS } from '@/lib/constants'

type Variante = 'primary' | 'success' | 'danger' | 'whatsapp' | 'outline' | 'neutral'

type Grad = readonly [string, string, ...string[]]
const GRAD: Partial<Record<Variante, Grad>> = {
  primary: GRADIENTS.primary,
  success: GRADIENTS.success,
  danger: GRADIENTS.danger,
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
  const color = outline ? COLORS.danger : neutral ? COLORS.text : '#fff'
  const grad = GRAD[variant]

  const contenido = loading ? (
    <ActivityIndicator color={color} />
  ) : (
    <View style={s.row}>
      {icon && <Feather name={icon} size={17} color={color} />}
      <Text style={[s.text, { color }]}>{label}</Text>
    </View>
  )

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[(disabled || loading) && { opacity: 0.5 }, style]}
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
  btn: { borderRadius: 16, paddingVertical: 15, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  outline: { borderWidth: 1.5, borderColor: COLORS.danger, backgroundColor: 'transparent' },
  neutral: { backgroundColor: COLORS.surfaceAlt },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { fontSize: 15, fontWeight: '700' },
})
