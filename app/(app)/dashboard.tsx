import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { getMetricas } from '@/api/dashboard'
import { getProximosCobros } from '@/api/prestamos'
import { contarNoLeidas } from '@/api/alertas'
import { contarPendientes, flush } from '@/lib/outbox'
import { useFmt } from '@/lib/useFmt'
import { useSession } from '@/store/session'
import { COLORS } from '@/lib/constants'

export default function Dashboard() {
  const router = useRouter()
  const f = useFmt()
  const carteraId = useSession((s) => s.carteraActivaId)
  const prestamistaId = useSession((s) => s.prestamistaId)

  const noLeidas = useQuery({
    queryKey: ['alertas-count', prestamistaId],
    queryFn: () => contarNoLeidas(prestamistaId!),
    enabled: !!prestamistaId,
  })

  const pendientes = useQuery({
    queryKey: ['outbox-count'],
    queryFn: contarPendientes,
    refetchInterval: 8000,
  })

  const metricas = useQuery({
    queryKey: ['metricas', carteraId],
    queryFn: () => getMetricas(carteraId!),
    enabled: !!carteraId,
  })
  const cobros = useQuery({
    queryKey: ['cobros-hoy', carteraId],
    queryFn: () => getProximosCobros(carteraId!, 7),
    enabled: !!carteraId,
  })

  const loading = metricas.isLoading || cobros.isLoading
  const refreshing = metricas.isRefetching || cobros.isRefetching

  function refrescar() {
    metricas.refetch()
    cobros.refetch()
  }

  if (!carteraId) {
    return (
      <View style={s.center}>
        <Text style={s.emptyTitle}>Sin cartera activa</Text>
        <Text style={s.emptySub}>Configura tu cartera para empezar</Text>
      </View>
    )
  }

  if (loading) {
    return <View style={s.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>
  }

  const m = metricas.data
  const lista = cobros.data ?? []

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ padding: 16, paddingTop: 56, paddingBottom: 110 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refrescar} />}
    >
      <View style={s.titleRow}>
        <Text style={s.title}>Préstalo</Text>
        <TouchableOpacity onPress={() => router.push('/alertas')} style={s.bell}>
          <Feather name="bell" size={22} color={COLORS.text} />
          {!!noLeidas.data && (
            <View style={s.badge}><Text style={s.badgeText}>{noLeidas.data > 9 ? '9+' : noLeidas.data}</Text></View>
          )}
        </TouchableOpacity>
      </View>

      {!!pendientes.data && pendientes.data > 0 && (
        <TouchableOpacity
          style={s.pend}
          onPress={() => flush().then(() => { pendientes.refetch(); cobros.refetch(); metricas.refetch() })}
        >
          <Text style={s.pendText}>↻ {pendientes.data} pendiente(s) de sincronizar — toca para reintentar</Text>
        </TouchableOpacity>
      )}

      <View style={s.hero}>
        <Text style={s.heroLabel}>Capital en la calle</Text>
        <Text style={s.heroMonto}>{f(m?.capital_en_calle ?? 0)}</Text>
        <Text style={s.heroSub}>{m?.clientes_activos ?? 0} clientes activos</Text>
      </View>

      <View style={s.grid}>
        <View style={s.met}><Text style={s.metLabel}>Total prestado</Text><Text style={s.metVal}>{f(m?.total_prestado ?? 0)}</Text></View>
        <View style={s.met}><Text style={s.metLabel}>En mora</Text><Text style={[s.metVal, { color: COLORS.danger }]}>{m?.prestamos_en_mora ?? 0}</Text></View>
      </View>

      <View style={s.sectionRow}>
        <Text style={s.section}>Próximos cobros (7 días)</Text>
        {lista.length > 0 && (
          <TouchableOpacity style={s.recordarRow} onPress={() => router.push('/recordatorios')}>
            <Feather name="message-circle" size={14} color="#25D366" />
            <Text style={s.recordar}>Recordar</Text>
          </TouchableOpacity>
        )}
      </View>
      {lista.length === 0 ? (
        <View style={s.emptyBox}>
          <Feather name="check-circle" size={40} color={COLORS.success} />
          <Text style={s.emptyTitle}>Sin cobros próximos</Text>
        </View>
      ) : (
        lista.map((p) => (
          <TouchableOpacity key={p.id} style={s.card} onPress={() => router.push(`/pago/${p.id}`)}>
            <View style={s.cardLeft}>
              <View style={s.avatar}><Text style={s.avatarText}>{(p.clientes?.nombre || 'XX').slice(0, 2).toUpperCase()}</Text></View>
              <View>
                <Text style={s.clienteNombre}>{p.clientes?.nombre || 'Cliente'}</Text>
                <Text style={s.clienteSub}>Vence {p.fecha_proximo_pago} · {f(p.saldo_pendiente)}</Text>
              </View>
            </View>
            <View style={[s.pill, p.estado === 'en_mora' && s.pillR, p.estado === 'activo' && s.pillG]}>
              <Text style={[s.pillText, p.estado === 'en_mora' && { color: COLORS.danger }, p.estado === 'activo' && { color: COLORS.success }]}>{p.estado}</Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  bell: { padding: 4 },
  bellIcon: { fontSize: 24 },
  badge: { position: 'absolute', top: 0, right: 0, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  pend: { backgroundColor: '#fff4e5', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: COLORS.warning },
  pendText: { color: COLORS.warning, fontWeight: '700', fontSize: 13, textAlign: 'center' },
  hero: { backgroundColor: COLORS.primary, borderRadius: 20, padding: 24, marginBottom: 16, alignItems: 'center' },
  heroLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 },
  heroMonto: { fontSize: 38, fontWeight: '800', color: COLORS.gold, letterSpacing: -1 },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8 },
  grid: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  met: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 14, padding: 14 },
  metLabel: { fontSize: 11, color: COLORS.textLight, marginBottom: 6 },
  metVal: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  section: { fontSize: 11, fontWeight: '700', color: '#ccc', textTransform: 'uppercase', letterSpacing: 1 },
  recordarRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recordar: { color: '#25D366', fontWeight: '700', fontSize: 13 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.bg, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 14, padding: 14, marginBottom: 8 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#ede7f6', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  clienteNombre: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  clienteSub: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: COLORS.surface },
  pillR: { backgroundColor: '#ffebee' },
  pillG: { backgroundColor: '#e8f5e9' },
  pillText: { fontSize: 11, fontWeight: '700', color: COLORS.textLight },
  emptyBox: { alignItems: 'center', paddingVertical: 30 },
  emptyEmoji: { fontSize: 44, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  emptySub: { fontSize: 13, color: COLORS.textLight, textAlign: 'center', marginTop: 4 },
})
