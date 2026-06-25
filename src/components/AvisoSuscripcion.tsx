import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { COLORS } from '@/lib/constants'
import { useSuscripcion } from '@/store/suscripcion'

/** Banner contextual: avisa de los días de prueba o del modo solo lectura. Lleva al paywall. */
export function AvisoSuscripcion() {
  const router = useRouter()
  const { estado, diasRestantes } = useSuscripcion()

  if (estado === 'activa' || estado === 'cargando') return null

  const expirada = estado === 'expirada'
  const texto = expirada
    ? 'Prueba terminada — modo solo lectura'
    : `Prueba gratis: ${diasRestantes} ${diasRestantes === 1 ? 'día' : 'días'} restantes`

  return (
    <TouchableOpacity
      style={[s.banner, expirada ? s.bannerWarn : s.bannerInfo]}
      onPress={() => router.push('/suscripcion')}
      activeOpacity={0.85}
    >
      <Feather name={expirada ? 'lock' : 'clock'} size={16} color={expirada ? COLORS.danger : COLORS.primary} />
      <Text style={[s.texto, { color: expirada ? COLORS.danger : COLORS.primary }]}>{texto}</Text>
      <View style={[s.cta, { backgroundColor: expirada ? COLORS.danger : COLORS.primary }]}>
        <Text style={s.ctaText}>{expirada ? 'Suscribirme' : 'Ver plan'}</Text>
      </View>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1 },
  bannerInfo: { backgroundColor: COLORS.surface, borderColor: 'rgba(79,70,229,0.25)' },
  bannerWarn: { backgroundColor: '#FEF2F2', borderColor: 'rgba(239,68,68,0.3)' },
  texto: { flex: 1, fontSize: 13, fontWeight: '700' },
  cta: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  ctaText: { color: '#fff', fontSize: 12, fontWeight: '700' },
})
