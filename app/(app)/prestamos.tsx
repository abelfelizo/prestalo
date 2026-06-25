import { useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { getPrestamos } from '@/api/prestamos'
import { useFmt } from '@/lib/useFmt'
import { useSession } from '@/store/session'
import { exigirSuscripcion } from '@/lib/guard'
import { AvisoSuscripcion } from '@/components/AvisoSuscripcion'
import { COLORS } from '@/lib/constants'

export default function Prestamos() {
  const router = useRouter()
  const f = useFmt()
  const carteraId = useSession((s) => s.carteraActivaId)
  const [q, setQ] = useState('')
  const { data, isLoading } = useQuery({
    queryKey: ['prestamos', carteraId],
    queryFn: () => getPrestamos(carteraId!),
    enabled: !!carteraId,
  })

  if (isLoading) return <View style={s.center}><ActivityIndicator color={COLORS.primary} /></View>

  const term = q.trim().toLowerCase()
  const prestamos = (data ?? []).filter(
    (p) => !term || (p.clientes?.nombre ?? '').toLowerCase().includes(term),
  )

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Préstamos</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => exigirSuscripcion(router) && router.push('/prestamo/nuevo')}>
          <Feather name="plus" size={15} color="#fff" />
          <Text style={s.addText}>Nuevo</Text>
        </TouchableOpacity>
      </View>
      <AvisoSuscripcion />
      <TextInput
        style={s.search}
        value={q}
        onChangeText={setQ}
        placeholder="Buscar por cliente"
        placeholderTextColor="#bbb"
      />
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
          contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.card} onPress={() => router.push(`/prestamo/${item.id}`)}>
              <View style={s.cardTop}>
                <Text style={s.clienteNombre}>{item.clientes?.nombre || 'Cliente'}</Text>
                <View style={[s.pill, item.estado === 'en_mora' && s.pillR, item.estado === 'activo' && s.pillG]}>
                  <Text style={[s.pillText, item.estado === 'en_mora' && { color: COLORS.danger }, item.estado === 'activo' && { color: COLORS.success }]}>{item.estado}</Text>
                </View>
              </View>
              <View style={s.montos}>
                <View><Text style={s.montoLabel}>Saldo</Text><Text style={s.montoVal}>{f(item.saldo_pendiente)}</Text></View>
                <View><Text style={s.montoLabel}>Capital</Text><Text style={s.montoVal}>{f(item.monto_capital)}</Text></View>
                <View><Text style={s.montoLabel}>Cuotas</Text><Text style={s.montoVal}>{item.cuotas_pagadas}/{item.num_cuotas}</Text></View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 56 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  addBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 5 },
  addText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  search: { marginHorizontal: 16, marginBottom: 6, backgroundColor: COLORS.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: COLORS.text, borderWidth: 1.5, borderColor: COLORS.border },
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
