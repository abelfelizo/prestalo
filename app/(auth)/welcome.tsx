import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { COLORS } from '../../constants'

export default function Welcome() {
  const router = useRouter()

  return (
    <View style={s.container}>
      <View style={s.logoBox}>
        <Text style={s.logoEmoji}>💰</Text>
      </View>
      <Text style={s.title}>Préstalo</Text>
      <Text style={s.subtitle}>Gestiona tus préstamos{'\n'}de forma inteligente</Text>
      <TouchableOpacity style={s.btn} onPress={() => router.push('/(auth)/pin')}>
        <Text style={s.btnText}>Crear PIN de acceso</Text>
      </TouchableOpacity>
      <Text style={s.version}>v1.0 — Fase 2</Text>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', padding: 32 },
  logoBox: { width: 100, height: 100, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  logoEmoji: { fontSize: 52 },
  title: { fontSize: 44, fontWeight: '800', color: COLORS.gold, marginBottom: 8 },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 52, lineHeight: 24 },
  btn: { width: '100%', padding: 16, backgroundColor: COLORS.gold, borderRadius: 14, alignItems: 'center' },
  btnText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  version: { position: 'absolute', bottom: 32, fontSize: 12, color: 'rgba(255,255,255,0.2)' },
})
