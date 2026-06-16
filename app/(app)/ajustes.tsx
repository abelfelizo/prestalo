import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { getCarteras, setCarteraActiva } from '@/api/prestamistas'
import { signOut } from '@/api/auth'
import { limpiarPinLocal } from '@/lib/pin'
import { queryClient } from '@/lib/queryClient'
import { useSession } from '@/store/session'
import { COLORS, COLOR_CARTERA } from '@/lib/constants'
import type { ColorCartera } from '@/types'

export default function Ajustes() {
  const router = useRouter()
  const { prestamistaId, carteraActivaId, setCarteraActiva: setActivaLocal, setMoneda, reset } = useSession()

  const carteras = useQuery({
    queryKey: ['carteras', prestamistaId],
    queryFn: () => getCarteras(prestamistaId!),
    enabled: !!prestamistaId,
  })

  async function cambiarCartera(id: string, moneda: string) {
    if (!prestamistaId) return
    await setCarteraActiva(prestamistaId, id)
    setActivaLocal(id)
    setMoneda(moneda)
    queryClient.invalidateQueries()
    Alert.alert('Cartera activa actualizada')
  }

  async function cerrarSesion() {
    Alert.alert('Cerrar sesión', '¿Seguro que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          await signOut()
          await limpiarPinLocal()
          reset()
          queryClient.clear()
          router.replace('/(auth)/login')
        },
      },
    ])
  }

  return (
    <View style={s.container}>
      <Text style={s.title}>Ajustes</Text>

      <Text style={s.section}>Mis carteras</Text>
      {carteras.isLoading ? (
        <ActivityIndicator color={COLORS.primary} />
      ) : (
        (carteras.data ?? []).map((c) => (
          <TouchableOpacity key={c.id} style={s.cartera} onPress={() => cambiarCartera(c.id, c.moneda)}>
            <View style={[s.dot, { backgroundColor: COLOR_CARTERA[c.color as ColorCartera] ?? COLORS.primary }]} />
            <Text style={s.carteraNombre}>{c.nombre}</Text>
            <Text style={s.carteraMoneda}>{c.moneda}</Text>
            {carteraActivaId === c.id && <Text style={s.activa}>✓ activa</Text>}
          </TouchableOpacity>
        ))
      )}

      <TouchableOpacity style={s.logout} onPress={cerrarSesion}>
        <Text style={s.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 16, paddingTop: 56 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  section: { fontSize: 11, fontWeight: '700', color: '#ccc', textTransform: 'uppercase', letterSpacing: 1, marginTop: 24, marginBottom: 10 },
  cartera: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginBottom: 8 },
  dot: { width: 16, height: 16, borderRadius: 8 },
  carteraNombre: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.text },
  carteraMoneda: { fontSize: 13, color: COLORS.textLight },
  activa: { fontSize: 12, color: COLORS.success, fontWeight: '700', marginLeft: 8 },
  logout: { marginTop: 32, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.danger },
  logoutText: { color: COLORS.danger, fontWeight: '700', fontSize: 15 },
})
