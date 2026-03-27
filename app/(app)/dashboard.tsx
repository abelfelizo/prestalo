import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native'
import { useEffect, useState, useCallback } from 'react'
import { getMetricas, getPrestamos } from '../../lib/db'
import { fmt } from '../../lib/calculos'
import { getCarteraActiva } from '../../lib/storage'
import { COLORS } from '../../constants'

export default function Dashboard() {
  const [metricas, setMetricas] = useState<any>(null)
  const [prestamos, setPrestamos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [carteraId, setCarteraId] = useState<string | null>(null)

  async function cargar() {
    try {
      const id = await getCarteraActiva()
      setCarteraId(id)
      if (id) {
        const [m, p] = await Promise.all([getMetricas(id), getPrestamos(id)])
        setMetricas(m)
        setPrestamos(p.slice(0, 5))
      }
    } catch (e) {
      console.log('Error:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const onRefresh = useCallback(() => { setRefreshing(true); cargar() }, [])

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    )
  }

  if (!carteraId) {
    return (
      <View style={s.center}>
        <Text style={s.emptyTitle}>Sin cartera activa</Text>
        <Text style={s.emptySub}>Configura tu cartera en ajustes</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ padding: 16, paddingTop: 56 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={s.greeting}>Buenos días 👋</Text>
      <Text style={s.title}>Préstalo</Text>

      {/* HERO */}
      <View style={s.hero}>
        <Text style={s.heroLabel}>Capital en la calle</Text>
        <Text style={s.heroMonto}>{fmt(metricas?.saldo_pendiente || 0)}</Text>
        <Text style={s.heroSub}>{metricas?.clientes_activos || 0} clientes activos</Text>
      </View>

      {/* MÉTRICAS */}
      <View style={s.grid}>
        <View style={s.met}>
          <Text style={s.metLabel}>Total prestado</Text>
          <Text style={s.metVal}>{fmt(metricas?.total_prestado || 0)}</Text>
        </View>
        <View style={s.met}>
          <Text style={s.metLabel}>Cobrado</Text>
          <Text style={[s.metVal, { color: COLORS.success }]}>{fmt(metricas?.total_cobrado || 0)}</Text>
        </View>
        <View style={s.met}>
          <Text style={s.metLabel}>Vencidos</Text>
          <Text style={[s.metVal, { color: COLORS.danger }]}>{metricas?.prestamos_vencidos || 0}</Text>
        </View>
        <View style={s.met}>
          <Text style={s.metLabel}>Clientes</Text>
          <Text style={s.metVal}>{metricas?.clientes_activos || 0}</Text>
        </View>
      </View>

      {/* ACCIONES RÁPIDAS */}
      <View style={s.actions}>
        <TouchableOpacity style={s.actionBtn}>
          <Text style={s.actionEmoji}>💸</Text>
          <Text style={s.actionText}>Nuevo préstamo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#e8f5e9' }]}>
          <Text style={s.actionEmoji}>✅</Text>
          <Text style={[s.actionText, { color: COLORS.success }]}>Registrar pago</Text>
        </TouchableOpacity>
      </View>

      {/* COBROS DE HOY */}
      {prestamos.length > 0 && (
        <>
          <Text style={s.section}>Préstamos recientes</Text>
          {prestamos.map((p: any) => (
            <View key={p.id} style={s.card}>
              <View style={s.cardLeft}>
                <View style={s.avatar}>
                  <Text style={s.avatarText}>{(p.clientes?.nombre || 'XX').slice(0, 2).toUpperCase()}</Text>
                </View>
                <View>
                  <Text style={s.clienteNombre}>{p.clientes?.nombre || 'Cliente'}</Text>
                  <Text style={s.clienteSub}>Saldo: {fmt(p.saldo_pendiente || 0)}</Text>
                </View>
              </View>
              <View style={[s.estadoPill, p.estado === 'vencido' && s.pillVencido, p.estado === 'activo' && s.pillActivo]}>
                <Text style={[s.estadoText, p.estado === 'vencido' && { color: COLORS.danger }, p.estado === 'activo' && { color: COLORS.success }]}>
                  {p.estado}
                </Text>
              </View>
            </View>
          ))}
        </>
      )}

      {prestamos.length === 0 && (
        <View style={s.emptyBox}>
          <Text style={s.emptyEmoji}>📋</Text>
          <Text style={s.emptyTitle}>Sin préstamos activos</Text>
          <Text style={s.emptySub}>Toca "Nuevo préstamo" para empezar</Text>
        </View>
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
  greeting: { fontSize: 14, color: COLORS.textLight, marginBottom: 2 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.primary, marginBottom: 20 },
  hero: { backgroundColor: COLORS.primary, borderRadius: 20, padding: 24, marginBottom: 16, alignItems: 'center' },
  heroLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 6 },
  heroMonto: { fontSize: 42, fontWeight: '800', color: COLORS.gold, letterSpacing: -1 },
  heroSub: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  met: { flex: 1, minWidth: '45%', backgroundColor: COLORS.surface, borderRadius: 14, padding: 14 },
  metLabel: { fontSize: 11, color: COLORS.textLight, marginBottom: 6 },
  metVal: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  actions: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  actionBtn: { flex: 1, backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center' },
  actionEmoji: { fontSize: 24, marginBottom: 6 },
  actionText: { fontSize: 13, fontWeight: '700', color: '#fff', textAlign: 'center' },
  section: { fontSize: 11, fontWeight: '700', color: '#ccc', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.bg, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 14, padding: 14, marginBottom: 8 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#ede7f6', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  clienteNombre: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  clienteSub: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  estadoPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: COLORS.surface },
  pillVencido: { backgroundColor: '#ffebee' },
  pillActivo: { backgroundColor: '#e8f5e9' },
  estadoText: { fontSize: 11, fontWeight: '700', color: COLORS.textLight },
  emptyBox: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 6 },
  emptySub: { fontSize: 13, color: COLORS.textLight, textAlign: 'center' },
})
