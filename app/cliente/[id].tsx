import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { errMsg } from '@/lib/errores'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { getCliente, eliminarCliente } from '@/api/clientes'
import { getPrestamosDeCliente } from '@/api/prestamos'
import { useFmt } from '@/lib/useFmt'
import { useSession } from '@/store/session'
import { queryClient } from '@/lib/queryClient'
import { cobrarPorWhatsApp } from '@/lib/whatsapp'
import { usePinPrompt } from '@/store/pinPrompt'
import { color, font, radius, shadowCard, gradient } from '@/theme'

function estadoTinte(estado: string) {
  if (estado === 'en_mora') return { bg: color.dangerTint, fg: color.danger, label: 'Mora' }
  if (estado === 'activo') return { bg: color.successTint, fg: color.success, label: 'Al día' }
  return { bg: color.indigoTint, fg: color.primary, label: estado }
}

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
        Alert.alert('Error', errMsg(e, 'No se pudo eliminar'))
      }
    }, 'PIN para eliminar el cliente')
  }

  if (cliente.isLoading || !cliente.data) {
    return <View style={s.center}><ActivityIndicator color={color.primary} /></View>
  }
  const c = cliente.data

  return (
    <View style={s.container}>
      <View style={s.header}>
        <LinearGradient colors={gradient.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <TouchableOpacity style={s.back} onPress={() => router.back()}>
          <Feather name="chevron-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={s.avatar}><Text style={s.avatarText}>{c.nombre.slice(0, 2).toUpperCase()}</Text></View>
        <Text style={s.nombre}>{c.nombre}</Text>
        {!!c.telefono && <Text style={s.phone}>{c.telefono}</Text>}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 40 }}>
        <View style={s.statsCard}>
          <View style={s.stat}><Text style={s.statVal} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{f(c.total_prestado)}</Text><Text style={s.statLabel}>Prestado</Text></View>
          <View style={s.statDivider} />
          <View style={s.stat}><Text style={s.statVal} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{f(c.total_pagado)}</Text><Text style={s.statLabel}>Pagado</Text></View>
          <View style={s.statDivider} />
          <View style={s.stat}><Text style={s.statVal} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{c.veces_atrasado}</Text><Text style={s.statLabel}>Atrasos</Text></View>
        </View>

        {(!!c.cedula || !!c.direccion) && (
          <View style={s.box}>
            {!!c.cedula && <Row label="Cédula" val={c.cedula} />}
            {!!c.direccion && <Row label="Dirección" val={c.direccion} />}
          </View>
        )}

        {!!c.telefono && (
          <TouchableOpacity style={s.wa} onPress={() => cobrarPorWhatsApp(c.telefono!, c.nombre, 0, moneda)} activeOpacity={0.9}>
            <Text style={s.waText}>Escribir por WhatsApp</Text>
          </TouchableOpacity>
        )}

        <View style={s.editRow}>
          <TouchableOpacity style={s.editBtn} onPress={() => router.push(`/cliente/nuevo?id=${id}`)} activeOpacity={0.8}>
            <Feather name="edit-2" size={15} color={color.ink} />
            <Text style={s.editText}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.delBtn} onPress={eliminar} activeOpacity={0.8}>
            <Feather name="trash-2" size={15} color={color.danger} />
            <Text style={s.delText}>Eliminar</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.section}>Préstamos</Text>
        {(prestamos.data ?? []).length === 0 ? (
          <Text style={s.empty}>Sin préstamos</Text>
        ) : (
          (prestamos.data ?? []).map((p) => {
            const e = estadoTinte(p.estado)
            return (
              <TouchableOpacity key={p.id} style={s.item} onPress={() => router.push(`/prestamo/${p.id}`)} activeOpacity={0.85}>
                <View style={s.itemRow}>
                  <Text style={s.itemTitle}>{f(p.saldo_pendiente)}</Text>
                  <View style={[s.pill, { backgroundColor: e.bg }]}><Text style={[s.pillText, { color: e.fg }]}>{e.label}</Text></View>
                </View>
                <Text style={s.itemSub}>{p.cuotas_pagadas}/{p.num_cuotas} cuotas · {p.frecuencia_cobro}</Text>
                {(p.estado === 'activo' || p.estado === 'en_mora') && (
                  <Text style={s.itemSub}>Próximo pago: {p.fecha_proximo_pago}</Text>
                )}
              </TouchableOpacity>
            )
          })
        )}
      </ScrollView>
    </View>
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
  container: { flex: 1, backgroundColor: color.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.bg },
  header: { paddingTop: 54, paddingBottom: 30, alignItems: 'center', overflow: 'hidden' },
  back: { position: 'absolute', top: 50, left: 16, width: 38, height: 38, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  avatarText: { fontFamily: font.display, fontSize: 24, color: color.primary },
  nombre: { fontFamily: font.display, fontSize: 20, color: '#fff', letterSpacing: -0.4 },
  phone: { fontFamily: font.body, fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 3 },
  statsCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: color.surface, borderRadius: radius.card, padding: 18, marginTop: 16, ...shadowCard },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 28, backgroundColor: color.line },
  statVal: { fontFamily: font.displaySemi, fontSize: 14, color: color.ink, fontVariant: ['tabular-nums'] },
  statLabel: { fontFamily: font.body, fontSize: 11, color: color.muted, marginTop: 3 },
  box: { backgroundColor: color.surface, borderRadius: radius.xl, padding: 16, marginTop: 12, ...shadowCard },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowLabel: { fontFamily: font.body, fontSize: 14, color: color.muted },
  rowVal: { fontFamily: font.bodyBold, fontSize: 14, color: color.ink },
  wa: { backgroundColor: color.whatsapp, borderRadius: radius.lg, paddingVertical: 15, alignItems: 'center', marginTop: 14 },
  waText: { fontFamily: font.bodyBold, color: '#fff', fontSize: 15 },
  editRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  editBtn: { flex: 1, borderRadius: radius.md, padding: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: color.surface, ...shadowCard },
  editText: { fontFamily: font.bodyBold, color: color.ink, fontSize: 14 },
  delBtn: { flex: 1, borderRadius: radius.md, padding: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: color.dangerTint },
  delText: { fontFamily: font.bodyBold, color: color.danger, fontSize: 14 },
  section: { fontFamily: font.displaySemi, fontSize: 14, color: color.ink, marginTop: 26, marginBottom: 12 },
  item: { backgroundColor: color.surface, borderRadius: radius.xl, padding: 14, marginBottom: 10, ...shadowCard },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitle: { fontFamily: font.displaySemi, fontSize: 15, color: color.ink },
  itemSub: { fontFamily: font.body, fontSize: 12, color: color.muted, marginTop: 3 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.sm },
  pillText: { fontFamily: font.bodyBold, fontSize: 10 },
  empty: { fontFamily: font.body, color: color.muted, fontSize: 13 },
})
