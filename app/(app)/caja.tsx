import { View, Text, StyleSheet } from 'react-native'
import { COLORS } from '@/lib/constants'

export default function Caja() {
  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Caja</Text>
        <Text style={s.sub}>Control de ingresos y egresos</Text>
      </View>
      <View style={s.empty}>
        <Text style={s.emptyEmoji}>🏦</Text>
        <Text style={s.emptyTitle}>Próximamente</Text>
        <Text style={s.emptySub}>El módulo de caja estará disponible{'\n'}en la próxima versión</Text>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: 16, paddingTop: 56 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  sub: { fontSize: 13, color: COLORS.textLight, marginTop: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  emptySub: { fontSize: 13, color: COLORS.textLight, marginTop: 4, textAlign: 'center', lineHeight: 20 },
})
