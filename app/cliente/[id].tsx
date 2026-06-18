import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { getCliente, eliminarCliente } from '@/api/clientes'
import { getPrestamosDeCliente } from '@/api/prestamos'
import { useFmt } from '@/lib/useFmt'
import { useSession } from '@/store/session'
import { queryClient } from '@/lib/queryClient'
import { cobrarPorWhatsApp } from '@/lib/whatsapp'
import { usePinPrompt } from '@/store/pinPrompt'
import { COLORS } from '@/lib/constants'

export default function DetalleCliente() {
  const router = useRouter()
  const f = useFmt()
  const moneda = useSession((s) => s.moneda)
  const carteraId = useSession((s) => s.carteraActivaId)
  const pedirPin = usePinPrompt((s) => s.pedirPin)
  const { id } = useLocalSearchParams<{ id: string }>()

  const cliente = useQuery({ queryKey: ['cliente', id], queryFn: () => getCliente(id), enabled: !!id })
  const prestamos = useQuery({ queryKey: ['prestamos-cliente', id], queryFn: () => getPrestamosDeCliente(id), enabled: !!id })

  function eliminar() {
    pedirPin(async () => {
      try {
        await eliminarCliente(id)
        queryClient.invalidateQueries({ queryKey: ['clientes', carteraId] })
        router.back()
      } catch (e: any) {
        Alert.alert('Error', e.message ?? 'No se pudo eliminar')
      }
    }, 'PIN para eliminar el cliente')
  }

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
        <Row label="Total prestado" val={f(c.total_prestado)} />
        <Row label="Total pagado" val={f(c.total_pagado)} />
        <Row label="Veces atrasado" val={String(c.veces_atrasado)} />
        {!!c.cedula && <Row label="Cédula" val={c.cedula} />}
        {!!c.direccion && <Row label="Dirección" val={c.direccion} />}
      </View>

      {!!c.telefono && (
        <TouchableOpacity
          style={s.wa}
          onPress={() => cobrarPorWhatsApp(c.telefono!, c.nombre, 0, moneda)}
        >
          <Feather name="message-circle" size={16} color="#fff" />
          <Text style={s.waText}>Escribir por WhatsApp</Text>
        </TouchableOpacity>
      )}

      <View style={s.editRow}>
        <TouchableOpacity style={s.editBtn} onPress={() => router.push(`/cliente/nuevo?id=${id}`)}>
          <Feather name="edit-2" size={15} color={COLORS.text} />
          <Text style={s.editText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.delBtn} onPress={eliminar}>
          <Feather name="trash-2" size={15} color={COLORS.danger} />
          <Text style={s.delText}>Eliminar</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.section}>Préstamos</Text>
      {(prestamos.data ?? []).length === 0 ? (
        <Text style={s.empty}>Sin préstamos</Text>
      ) : (
        (prestamos.data ?? []).map((p) => (
          <TouchableOpacity key={p.id} style={s.item} onPress={() => router.push(`/prestamo/${p.id}`)}>
            <View style={s.itemRow}>
              <Text style={s.itemTitle}>{f(p.saldo_pendiente)}</Text>
              <Text style={s.itemSub}>{p.estado}</Text>
            </View>
            <Text style={s.itemSub}>{p.cuotas_pagadas}/{p.num_cuotas} cuotas · {p.frecuencia_cobro}</Text>
            {(p.estado === 'activo' || p.estado === 'en_mora') && (
              <Text style={s.itemSub}>Próximo pago: {p.fecha_proximo_pago}</Text>
            )}
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
  wa: { backgroundColor: '#25D366', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14 },
  waText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  editRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  editBtn: { flex: 1, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: COLORS.border },
  editText: { fontWeight: '700', color: COLORS.text, fontSize: 14 },
  delBtn: { flex: 1, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: COLORS.danger },
  delText: { fontWeight: '700', color: COLORS.danger, fontSize: 14 },
  section: { fontSize: 11, fontWeight: '700', color: '#ccc', textTransform: 'uppercase', letterSpacing: 1, marginTop: 26, marginBottom: 10 },
  item: { backgroundColor: COLORS.bg, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 12, marginBottom: 8 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between' },
  itemTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  itemSub: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  empty: { color: COLORS.textLight, fontSize: 13 },
  cancel: { textAlign: 'center', color: COLORS.textLight, marginTop: 24, fontSize: 14 },
})
