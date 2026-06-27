import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { getMetricas } from '@/api/dashboard'
import { getProximosCobros } from '@/api/prestamos'
import { contarNoLeidas } from '@/api/alertas'
import { getCarterasAccesibles, setCarteraActiva as setCarteraActivaApi } from '@/api/prestamistas'
import { contarPendientes, flush, contarFallidas, reintentarFallidas } from '@/lib/outbox'
import { queryClient } from '@/lib/queryClient'
import { useFmt } from '@/lib/useFmt'
import { useSession } from '@/store/session'
import { AvisoSuscripcion } from '@/components/AvisoSuscripcion'
import { color, font, type as t, radius, space, shadowCard, shadowRaised, gradient } from '@/theme'

type Estado = 'activo' | 'en_mora' | string

function tinte(estado: Estado) {
  if (estado === 'en_mora') return { bg: color.dangerTint, fg: color.danger, label: 'Mora' }
  if (estado === 'activo') return { bg: color.successTint, fg: color.success, label: 'Al día' }
  return { bg: color.indigoTint, fg: color.primary, label: estado }
}

export default function Dashboard() {
  const router = useRouter()
  const f = useFmt()
  const carteraId = useSession((s) => s.carteraActivaId)
  const prestamistaId = useSession((s) => s.prestamistaId)
  const setCarteraActivaLocal = useSession((s) => s.setCarteraActiva)
  const setMoneda = useSession((s) => s.setMoneda)

  const carteras = useQuery({ queryKey: ['carteras-accesibles'], queryFn: getCarterasAccesibles })
  const carteraActiva = (carteras.data ?? []).find((c) => c.id === carteraId)

  function cambiarCartera() {
    const lista = carteras.data ?? []
    if (lista.length <= 1) {
      Alert.alert('Solo tienes una cartera', 'Crea otra desde Ajustes → Nueva cartera.')
      return
    }
    Alert.alert(
      'Cambiar cartera',
      'Elige la cartera que quieres ver',
      [
        ...lista.map((c) => ({
          text: `${c.nombre}${c.id === carteraId ? ' ✓' : ''}`,
          onPress: async () => {
            if (c.id === carteraId) return
            if (prestamistaId) await setCarteraActivaApi(prestamistaId, c.id).catch(() => {})
            setCarteraActivaLocal(c.id)
            setMoneda(c.moneda)
            queryClient.invalidateQueries()
          },
        })),
        { text: 'Cancelar', style: 'cancel' as const },
      ],
    )
  }

  const noLeidas = useQuery({
    queryKey: ['alertas-count', prestamistaId],
    queryFn: () => contarNoLeidas(prestamistaId!),
    enabled: !!prestamistaId,
  })
  const pendientes = useQuery({ queryKey: ['outbox-count'], queryFn: contarPendientes, refetchInterval: 8000 })
  const fallidas = useQuery({ queryKey: ['outbox-fallidas'], queryFn: contarFallidas, refetchInterval: 8000 })
  const metricas = useQuery({ queryKey: ['metricas', carteraId], queryFn: () => getMetricas(carteraId!), enabled: !!carteraId })
  const cobros = useQuery({ queryKey: ['cobros-hoy', carteraId], queryFn: () => getProximosCobros(carteraId!, 7), enabled: !!carteraId })

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
    return <View style={s.center}><ActivityIndicator color={color.primary} size="large" /></View>
  }

  const m = metricas.data
  const lista = cobros.data ?? []

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 56, paddingBottom: 110 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refrescar} />}
    >
      <View style={s.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.title}>Inicio</Text>
          <TouchableOpacity style={s.carteraChip} onPress={cambiarCartera} activeOpacity={0.7}>
            <Feather name="folder" size={13} color={color.primary} />
            <Text style={s.carteraChipText} numberOfLines={1}>{carteraActiva?.nombre ?? 'Mi cartera'}</Text>
            <Feather name="chevron-down" size={14} color={color.muted} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => router.push('/alertas')} style={s.bell}>
          <Feather name="bell" size={20} color={color.ink} />
          {!!noLeidas.data && (
            <View style={s.badge}><Text style={s.badgeText}>{noLeidas.data > 9 ? '9+' : noLeidas.data}</Text></View>
          )}
        </TouchableOpacity>
      </View>

      <AvisoSuscripcion />

      {!!pendientes.data && pendientes.data > 0 && (
        <TouchableOpacity style={s.pend} onPress={() => flush().then(() => { pendientes.refetch(); cobros.refetch(); metricas.refetch() })}>
          <Text style={s.pendText}>↻ {pendientes.data} pendiente(s) de sincronizar — toca para reintentar</Text>
        </TouchableOpacity>
      )}
      {!!fallidas.data && fallidas.data > 0 && (
        <TouchableOpacity
          style={s.fail}
          onPress={() => reintentarFallidas().then(() => flush()).then(() => { fallidas.refetch(); pendientes.refetch(); cobros.refetch(); metricas.refetch() })}
        >
          <Text style={s.failText}>⚠️ {fallidas.data} operación(es) no se guardaron — toca para reintentar</Text>
        </TouchableOpacity>
      )}

      {/* Hero */}
      <View style={s.hero}>
        <LinearGradient colors={gradient.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={[color.violet, 'transparent']} start={{ x: 1, y: 0 }} end={{ x: 0.2, y: 0.8 }} style={[StyleSheet.absoluteFill, { opacity: 0.5 }]} />
        <Text style={s.heroLabel}>Capital en la calle</Text>
        <Text style={s.heroMonto}>{f(m?.capital_en_calle ?? 0)}</Text>
        <View style={s.heroFoot}>
          <Feather name="users" size={13} color="rgba(255,255,255,0.9)" />
          <Text style={s.heroSub}>{m?.clientes_activos ?? 0} clientes activos</Text>
        </View>
      </View>

      <View style={s.grid}>
        <View style={s.met}>
          <Text style={s.metLabel}>Total prestado</Text>
          <Text style={s.metVal}>{f(m?.total_prestado ?? 0)}</Text>
        </View>
        <View style={s.met}>
          <Text style={s.metLabel}>En mora</Text>
          <Text style={[s.metVal, { color: color.danger }]}>{m?.prestamos_en_mora ?? 0} préstamos</Text>
        </View>
      </View>

      <View style={s.sectionRow}>
        <Text style={s.section}>Próximos cobros (7 días)</Text>
        {lista.length > 0 && (
          <TouchableOpacity style={s.recordarRow} onPress={() => router.push('/recordatorios')}>
            <Feather name="message-circle" size={14} color={color.whatsapp} />
            <Text style={s.recordar}>Recordar</Text>
          </TouchableOpacity>
        )}
      </View>

      {lista.length === 0 ? (
        <View style={s.emptyBox}>
          <Feather name="check-circle" size={40} color={color.success} />
          <Text style={s.emptyTitle}>Sin cobros próximos</Text>
        </View>
      ) : (
        lista.map((p) => {
          const c = tinte(p.estado)
          return (
            <TouchableOpacity key={p.id} style={s.card} onPress={() => router.push(`/pago/${p.id}`)} activeOpacity={0.85}>
              <View style={s.cardLeft}>
                <View style={[s.avatar, { backgroundColor: c.bg }]}>
                  <Text style={[s.avatarText, { color: c.fg }]}>{(p.clientes?.nombre || 'XX').slice(0, 2).toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={s.clienteNombre}>{p.clientes?.nombre || 'Cliente'}</Text>
                  <Text style={s.clienteSub}>Vence {p.fecha_proximo_pago} · {f(p.saldo_pendiente)}</Text>
                </View>
              </View>
              <View style={[s.pill, { backgroundColor: c.bg }]}>
                <View style={[s.dot, { backgroundColor: c.fg }]} />
                <Text style={[s.pillText, { color: c.fg }]}>{c.label}</Text>
              </View>
            </TouchableOpacity>
          )
        })
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.bg },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  title: { fontFamily: font.display, fontSize: 24, color: color.ink, letterSpacing: -0.6 },
  carteraChip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, marginTop: 4, paddingVertical: 5, paddingHorizontal: 10, borderRadius: radius.sm, backgroundColor: color.indigoTint },
  carteraChipText: { fontFamily: font.bodyBold, fontSize: 13, color: color.primary, maxWidth: 180 },
  bell: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center', ...shadowCard },
  badge: { position: 'absolute', top: 4, right: 4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: color.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  badgeText: { color: '#fff', fontSize: 9, fontFamily: font.bodyBold },
  pend: { backgroundColor: color.warningTint, borderRadius: radius.md, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: color.warning },
  pendText: { color: color.warning, fontFamily: font.bodyBold, fontSize: 13, textAlign: 'center' },
  fail: { backgroundColor: color.dangerTint, borderRadius: radius.md, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: color.danger },
  failText: { color: color.danger, fontFamily: font.bodyBold, fontSize: 13, textAlign: 'center' },
  hero: { borderRadius: radius.card, padding: 24, marginBottom: 14, overflow: 'hidden', ...shadowRaised },
  heroLabel: { fontFamily: font.bodySemi, fontSize: 13, color: 'rgba(255,255,255,0.85)', marginBottom: 8 },
  heroMonto: { fontFamily: font.display, fontSize: 34, color: '#fff', letterSpacing: -1, fontVariant: ['tabular-nums'] },
  heroFoot: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  heroSub: { fontFamily: font.bodySemi, fontSize: 12.5, color: 'rgba(255,255,255,0.9)' },
  grid: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  met: { flex: 1, backgroundColor: color.surface, borderRadius: radius.xl, padding: 15, ...shadowCard },
  metLabel: { fontFamily: font.bodySemi, fontSize: 11.5, color: color.muted, marginBottom: 6 },
  metVal: { fontFamily: font.displaySemi, fontSize: 18, color: color.ink, fontVariant: ['tabular-nums'] },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  section: { fontFamily: font.displaySemi, fontSize: 14, color: color.ink },
  recordarRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  recordar: { color: color.whatsapp, fontFamily: font.bodyBold, fontSize: 13 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: color.surface, borderRadius: radius.xl, padding: 13, marginBottom: 10, ...shadowCard },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: font.displaySemi, fontSize: 13 },
  clienteNombre: { fontFamily: font.bodyBold, fontSize: 14, color: color.ink },
  clienteSub: { fontFamily: font.body, fontSize: 12, color: color.muted, marginTop: 2 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.sm },
  dot: { width: 5, height: 5, borderRadius: 3 },
  pillText: { fontFamily: font.bodyBold, fontSize: 10 },
  emptyBox: { alignItems: 'center', paddingVertical: 30, gap: 10 },
  emptyTitle: { fontFamily: font.displaySemi, fontSize: 16, color: color.ink },
  emptySub: { fontFamily: font.body, fontSize: 13, color: color.muted, textAlign: 'center', marginTop: 4 },
})
