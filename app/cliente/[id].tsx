import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { getCliente } from '@/api/clientes'
import { getPrestamosDeCliente } from '@/api/prestamos'
import { fmt } from '@/lib/calculos'
import { cobrarPorWhatsApp } from '@/lib/whatsapp'
import { COLORS } from '@/lib/constants'

export default function DetalleCliente() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()

  const cliente = useQuery({ queryKey: ['cliente', id], queryFn: () => getCliente(id), enabled: !!id })
  const prestamos = useQuery({ queryKey: ['prestamos-cliente', id], queryFn: () => getPrestamosDeCliente(id), enabled: !!id })

  if (cliente.isLoading || !cliente.data) {
    return <View style={s.center}><ActivityIndicator color={COLORS.primary} /></View>
  }
  const c = cliente.data

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 20, paddingTop: 56 }}>
      <View style={s.headerRow}>
        <View style={s.avatar}><Text style={s.avatarText}>{c.nombre.slice(0, 2).toUpperCase()}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.nombre}>{c.nombre}</Text>
          {!!c.telefono && <Text style={s.sub}>{c.telefono}</Text>}
        </View>
        <View style={[s.score, c.score >= 80 && s.scoreGood, c.score < 50 && s.scoreBad]}>
          <Text style={s.scoreText}>{c.score}</Text>
        </View>
      </View>

      <View style={s.box}>
        <Row label="Total prestado" val={fmt(c.total_prestado)} />
        <Row label="Total pagado" val={fmt(c.total_pagado)} />
        <Row label="Veces atrasado" val={String(c.veces_atrasado)} />
        {!!c.cedula && <Row label="Cédula" val={c.cedula} />}
        {!!c.direccion && <Row label="Dirección" val={c.direccion} />}
      </View>

      {!!c.telefono && (
        <TouchableOpacity
          style={s.wa}
          onPress={() => cobrarPorWhatsApp(c.telefono!, c.nombre, 0, 'RD$')}
        >
          <Text style={s.waText}>💬 Escribir por WhatsApp</Text>
        </TouchableOpacity>
      )}

      <Text style={s.section}>Préstamos</Text>
      {(prestamos.data ?? []).length === 0 ? (
        <Text style={s.empty}>Sin préstamos</Text>
      ) : (
        (prestamos.data ?? []).map((p) => (
          <TouchableOpacity key={p.id} style={s.item} onPress={() => router.push(`/prestamo/${p.id}`)}>
            <View style={s.itemRow}>
              <Text style={s.itemTitle}>{fmt(p.saldo_pendiente)}</Text>
              <Text style={s.itemSub}>{p.estado}</Text>
            </View>
            <Text style={s.itemSub}>{p.cuotas_pagadas}/{p.num_cuotas} cuotas · {p.frecuencia_cobro}</Text>
          </TouchableOpacity>
        ))
      )}

      <TouchableOpacity onPress={() => router.back()}><Text style={s.cancel}>Volver</Text></TouchableOpacity>
    </ScrollView>
  )
}

function Row({ label, val }: { label: string; val: string }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowVal}>{val}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#ede7f6', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  nombre: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  sub: { fontSize: 13, color: COLORS.textLight, marginTop: 2 },
  score: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  scoreGood: { backgroundColor: '#e8f5e9' },
  scoreBad: { backgroundColor: '#ffebee' },
  scoreText: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  box: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, marginTop: 18 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowLabel: { fontSize: 14, color: COLORS.textLight },
  rowVal: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  wa: { backgroundColor: '#25D366', borderRadius: 14, padding: 14, alignItems: 'center', marginTop: 14 },
  waText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  section: { fontSize: 11, fontWeight: '700', color: '#ccc', textTransform: 'uppercase', letterSpacing: 1, marginTop: 26, marginBottom: 10 },
  item: { backgroundColor: COLORS.bg, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 12, marginBottom: 8 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between' },
  itemTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  itemSub: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  empty: { color: COLORS.textLight, fontSize: 13 },
  cancel: { textAlign: 'center', color: COLORS.textLight, marginTop: 24, fontSize: 14 },
})
