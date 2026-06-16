import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { getPrestamos } from '@/api/prestamos'
import { fmt } from '@/lib/calculos'
import { useSession } from '@/store/session'
import { COLORS } from '@/lib/constants'

export default function Prestamos() {
  const carteraId = useSession((s) => s.carteraActivaId)
  const { data, isLoading } = useQuery({
    queryKey: ['prestamos', carteraId],
    queryFn: () => getPrestamos(carteraId!),
    enabled: !!carteraId,
  })

  if (isLoading) return <View style={s.center}><ActivityIndicator color={COLORS.primary} /></View>

  const prestamos = data ?? []

  return (
    <View style={s.container}>
      <View style={s.header}><Text style={s.title}>Préstamos</Text></View>
      {prestamos.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyEmoji}>💸</Text>
          <Text style={s.emptyTitle}>Sin préstamos</Text>
          <Text style={s.emptySub}>Los préstamos aparecerán aquí</Text>
        </View>
      ) : (
        <FlatList
          data={prestamos}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={s.cardTop}>
                <Text style={s.clienteNombre}>{item.clientes?.nombre || 'Cliente'}</Text>
                <View style={[s.pill, item.estado === 'en_mora' && s.pillR, item.estado === 'activo' && s.pillG]}>
                  <Text style={[s.pillText, item.estado === 'en_mora' && { color: COLORS.danger }, item.estado === 'activo' && { color: COLORS.success }]}>{item.estado}</Text>
                </View>
              </View>
              <View style={s.montos}>
                <View><Text style={s.montoLabel}>Saldo</Text><Text style={s.montoVal}>{fmt(item.saldo_pendiente)}</Text></View>
                <View><Text style={s.montoLabel}>Capital</Text><Text style={s.montoVal}>{fmt(item.monto_capital)}</Text></View>
                <View><Text style={s.montoLabel}>Cuotas</Text><Text style={s.montoVal}>{item.cuotas_pagadas}/{item.num_cuotas}</Text></View>
              </View>
            </View>
          )}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { padding: 16, paddingTop: 56 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  emptySub: { fontSize: 13, color: COLORS.textLight, marginTop: 4 },
  card: { backgroundColor: COLORS.bg, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 14, padding: 14, marginBottom: 8 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  clienteNombre: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  pill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, backgroundColor: COLORS.surface },
  pillR: { backgroundColor: '#ffebee' },
  pillG: { backgroundColor: '#e8f5e9' },
  pillText: { fontSize: 11, fontWeight: '700', color: COLORS.textLight },
  montos: { flexDirection: 'row', justifyContent: 'space-between' },
  montoLabel: { fontSize: 11, color: COLORS.textLight, marginBottom: 2 },
  montoVal: { fontSize: 14, fontWeight: '700', color: COLORS.text },
})
