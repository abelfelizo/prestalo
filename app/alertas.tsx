import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { getAlertas, marcarLeida, marcarTodasLeidas } from '@/api/alertas'
import { queryClient } from '@/lib/queryClient'
import { useSession } from '@/store/session'
import { color as COLORS, font, radius, shadowCard } from '@/theme'

const ICONO: Record<string, string> = { cobro_hoy: '📅', mora: '⚠️', heredero: '🔑', cartera: '💼' }

export default function Alertas() {
  const router = useRouter()
  const prestamistaId = useSession((s) => s.prestamistaId)

  const { data, isLoading } = useQuery({
    queryKey: ['alertas', prestamistaId],
    queryFn: () => getAlertas(prestamistaId!),
    enabled: !!prestamistaId,
  })

  async function abrir(alertaId: string, leida: boolean, referenciaId: string | null, tipo: string) {
    if (!leida) {
      await marcarLeida(alertaId)
      queryClient.invalidateQueries({ queryKey: ['alertas', prestamistaId] })
      queryClient.invalidateQueries({ queryKey: ['alertas-count', prestamistaId] })
    }
    if (referenciaId && (tipo === 'mora' || tipo === 'cobro_hoy')) {
      router.push(`/prestamo/${referenciaId}`)
    }
  }

  async function leerTodas() {
    await marcarTodasLeidas(prestamistaId!)
    queryClient.invalidateQueries({ queryKey: ['alertas', prestamistaId] })
    queryClient.invalidateQueries({ queryKey: ['alertas-count', prestamistaId] })
  }

  if (isLoading) return <View style={s.center}><ActivityIndicator color={COLORS.primary} /></View>

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Alertas</Text>
        <TouchableOpacity onPress={leerTodas}><Text style={s.readAll}>Marcar leídas</Text></TouchableOpacity>
      </View>
      <FlatList
        data={data ?? []}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={s.empty}>Sin alertas</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.card, !item.leida && s.cardNoLeida]}
            onPress={() => abrir(item.id, item.leida, item.referencia_id, item.tipo)}
          >
            <Text style={s.icono}>{ICONO[item.tipo] ?? '🔔'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.cardTitle}>{item.titulo}</Text>
              <Text style={s.cardMsg}>{item.mensaje}</Text>
              <Text style={s.fecha}>{item.fecha_alerta}</Text>
            </View>
            {!item.leida && <View style={s.dot} />}
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Text style={s.back}>Volver</Text></TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, paddingTop: 56 },
  title: { fontFamily: font.display, fontSize: 24, color: COLORS.ink, letterSpacing: -0.6 },
  readAll: { fontFamily: font.bodySemi, color: COLORS.primary, fontSize: 14 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.surface, borderRadius: radius.lg, padding: 14, marginBottom: 8, ...shadowCard },
  cardNoLeida: { backgroundColor: COLORS.indigoTint },
  icono: { fontSize: 22 },
  cardTitle: { fontFamily: font.bodyBold, fontSize: 14, color: COLORS.ink },
  cardMsg: { fontFamily: font.body, fontSize: 13, color: COLORS.muted, marginTop: 2 },
  fecha: { fontFamily: font.body, fontSize: 11, color: COLORS.faint, marginTop: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.danger },
  empty: { fontFamily: font.body, textAlign: 'center', color: COLORS.muted, marginTop: 40 },
  backBtn: { padding: 16 },
  back: { fontFamily: font.bodySemi, textAlign: 'center', color: COLORS.muted, fontSize: 14 },
})
