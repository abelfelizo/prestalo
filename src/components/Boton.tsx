import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View, type ViewStyle } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { COLORS } from '@/lib/constants'

type Variante = 'primary' | 'success' | 'danger' | 'outline' | 'whatsapp' | 'neutral'

const FONDOS: Record<Variante, string> = {
  primary: COLORS.primary,
  success: COLORS.success,
  danger: COLORS.danger,
  whatsapp: '#25D366',
  outline: 'transparent',
  neutral: COLORS.surfaceAlt,
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
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        s.btn,
        { backgroundColor: FONDOS[variant] },
        outline && { borderWidth: 1.5, borderColor: COLORS.danger },
        (disabled || loading) && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <View style={s.row}>
          {icon && <Feather name={icon} size={17} color={color} />}
          <Text style={[s.text, { color }]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  btn: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { fontSize: 15, fontWeight: '700' },
})
