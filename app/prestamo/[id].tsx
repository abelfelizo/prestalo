import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { getPrestamo, otorgarProrroga, cancelarPrestamo } from '@/api/prestamos'
import { getPagosDePrestamo, anularPago } from '@/api/pagos'
import { getGarantias, devolverGarantia } from '@/api/garantias'
import { getConfigCartera } from '@/api/config'
import { primeraFechaPago } from '@/lib/calculos'
import { useFmt } from '@/lib/useFmt'
import { useSession } from '@/store/session'
import { queryClient } from '@/lib/queryClient'
import { cobrarPorWhatsApp } from '@/lib/whatsapp'
import { COLORS } from '@/lib/constants'
import type { Frecuencia } from '@/types'

export default function DetallePrestamo() {
  const router = useRouter()
  const f = useFmt()
  const moneda = useSession((s) => s.moneda)
  const carteraId = useSession((s) => s.carteraActivaId)
  const { id } = useLocalSearchParams<{ id: string }>()

  const prestamo = useQuery({ queryKey: ['prestamo', id], queryFn: () => getPrestamo(id), enabled: !!id })
  const pagos = useQuery({ queryKey: ['pagos', id], queryFn: () => getPagosDePrestamo(id), enabled: !!id })
  const garantias = useQuery({ queryKey: ['garantias', id], queryFn: () => getGarantias(id), enabled: !!id })
  const config = useQuery({ queryKey: ['config', carteraId], queryFn: () => getConfigCartera(carteraId!), enabled: !!carteraId })

  if (prestamo.isLoading || !prestamo.data) {
    return <View style={s.center}><ActivityIndicator color={COLORS.primary} /></View>
  }
  const p = prestamo.data
  const activo = p.estado === 'activo' || p.estado === 'en_mora'

  function refrescarTodo() {
    queryClient.invalidateQueries({ queryKey: ['prestamo', id] })
    queryClient.invalidateQueries({ queryKey: ['pagos', id] })
    queryClient.invalidateQueries({ queryKey: ['garantias', id] })
    queryClient.invalidateQueries({ queryKey: ['prestamos', carteraId] })
    queryClient.invalidateQueries({ queryKey: ['cobros-hoy', carteraId] })
    queryClient.invalidateQueries({ queryKey: ['metricas', carteraId] })
    queryClient.invalidateQueries({ queryKey: ['caja', carteraId] })
    queryClient.invalidateQueries({ queryKey: ['caja-balance', carteraId] })
  }

  async function prorrogar() {
    const nueva = primeraFechaPago(p.fecha_proximo_pago, p.frecuencia_cobro as Frecuencia)
    Alert.alert('Otorgar prórroga', `Mover el próximo pago a ${nueva}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sí',
        onPress: async () => {
          try {
            await otorgarProrroga(p.id, nueva)
            refrescarTodo()
          } catch (e: any) {
            Alert.alert('Error', e.message ?? 'No se pudo otorgar la prórroga')
          }
        },
      },
    ])
  }

  function cancelar() {
    Alert.alert('Cancelar préstamo', 'El préstamo quedará sin efecto. ¿Continuar?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Cancelar préstamo',
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelarPrestamo(p.id)
            refrescarTodo()
            router.back()
          } catch (e: any) {
            Alert.alert('Error', e.message ?? 'No se pudo cancelar')
          }
        },
      },
    ])
  }

  function anular(pagoId: string) {
    Alert.alert('Anular pago', 'Se revertirá el saldo y la caja. ¿Continuar?', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Anular',
        style: 'destructive',
        onPress: async () => {
          try {
            await anularPago(pagoId)
            refrescarTodo()
          } catch (e: any) {
            Alert.alert('Error', e.message ?? 'No se pudo anular')
          }
        },
      },
    ])
  }

  async function devolver(garantiaId: string) {
    try {
      await devolverGarantia(garantiaId)
      queryClient.invalidateQueries({ queryKey: ['garantias', id] })
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo actualizar')
    }
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 20, paddingTop: 56 }}>
      <Text style={s.cliente}>{p.clientes?.nombre ?? 'Cliente'}</Text>
      <View style={[s.pill, p.estado === 'en_mora' && s.pillR, p.estado === 'activo' && s.pillG]}>
        <Text style={s.pillText}>{p.estado}</Text>
      </View>

      <View style={s.box}>
        <Row label="Saldo pendiente" val={f(p.saldo_pendiente)} />
        <Row label="Capital" val={f(p.monto_capital)} />
        <Row label="Tasa" val={`${p.tasa_interes}% (${p.modelo_interes})`} />
        <Row label="Cuotas" val={`${p.cuotas_pagadas}/${p.num_cuotas} (${p.frecuencia_cobro})`} />
        <Row label="Próximo pago" val={p.fecha_proximo_pago} />
        {p.dias_en_mora > 0 && <Row label="Días en mora" val={String(p.dias_en_mora)} />}
      </View>

      <View style={s.actions}>
        <TouchableOpacity style={[s.action, { backgroundColor: COLORS.success }]} onPress={() => router.push(`/pago/${p.id}`)}>
          <Text style={s.actionText}>✅ Registrar pago</Text>
        </TouchableOpacity>
        {!!p.clientes?.telefono && (
          <TouchableOpacity
            style={[s.action, { backgroundColor: '#25D366' }]}
            onPress={() => cobrarPorWhatsApp(p.clientes!.telefono!, p.clientes!.nombre, Number(p.saldo_pendiente), moneda, config.data?.mensaje_mora_whatsapp)}
          >
            <Text style={s.actionText}>💬 Cobrar</Text>
          </TouchableOpacity>
        )}
      </View>

      {activo && (
        <View style={s.actions}>
          <TouchableOpacity style={[s.action, { backgroundColor: COLORS.info }]} onPress={prorrogar}>
            <Text style={s.actionText}>🕓 Prórroga</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.action, { backgroundColor: COLORS.warning }]} onPress={() => router.push(`/prestamo/refinanciar?id=${p.id}`)}>
            <Text style={s.actionText}>🔄 Refinanciar</Text>
          </TouchableOpacity>
        </View>
      )}
      {activo && (
        <TouchableOpacity style={s.cancelLoan} onPress={cancelar}>
          <Text style={s.cancelLoanText}>Cancelar préstamo</Text>
        </TouchableOpacity>
      )}

      <Text style={s.section}>Garantías</Text>
      {(garantias.data ?? []).length === 0 ? (
        <Text style={s.empty}>Sin garantías</Text>
      ) : (
        (garantias.data ?? []).map((g) => (
          <View key={g.id} style={s.item}>
            <Text style={s.itemTitle}>{g.tipo}</Text>
            {!!g.descripcion && <Text style={s.itemSub}>{g.descripcion}</Text>}
            <Text style={s.itemSub}>{g.estado}</Text>
            {!!g.foto_urls?.length && (
              <View style={s.fotos}>
                {g.foto_urls.map((url) => (
                  <Image key={url} source={{ uri: url }} style={s.foto} />
                ))}
              </View>
            )}
            {g.estado === 'en_poder' && (
              <TouchableOpacity onPress={() => devolver(g.id)}>
                <Text style={s.linkSmall}>Marcar como devuelta</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}
      <TouchableOpacity onPress={() => router.push(`/garantia/nueva?prestamoId=${p.id}`)}>
        <Text style={s.link}>+ Agregar garantía</Text>
      </TouchableOpacity>

      <Text style={s.section}>Historial de pagos</Text>
      {(pagos.data ?? []).length === 0 ? (
        <Text style={s.empty}>Sin pagos registrados</Text>
      ) : (
        (pagos.data ?? []).map((pg) => (
          <View key={pg.id} style={s.item}>
            <View style={s.itemRow}>
              <Text style={s.itemTitle}>{f(pg.monto_total)}</Text>
              <Text style={s.itemSub}>{pg.fecha_pago}</Text>
            </View>
            <Text style={s.itemSub}>
              Capital {f(pg.monto_capital)} · Interés {f(pg.monto_interes)}
              {Number(pg.monto_mora) > 0 ? ` · Mora ${f(pg.monto_mora)}` : ''}
            </Text>
            <TouchableOpacity onPress={() => anular(pg.id)}>
              <Text style={s.anular}>Anular</Text>
            </TouchableOpacity>
          </View>
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
  cliente: { fontSize: 26, fontWeight: '800', color: COLORS.primary },
  pill: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, backgroundColor: COLORS.surface, marginTop: 8 },
  pillR: { backgroundColor: '#ffebee' },
  pillG: { backgroundColor: '#e8f5e9' },
  pillText: { fontSize: 12, fontWeight: '700', color: COLORS.text },
  box: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, marginTop: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowLabel: { fontSize: 14, color: COLORS.textLight },
  rowVal: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  action: { flex: 1, borderRadius: 14, padding: 14, alignItems: 'center' },
  actionText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  section: { fontSize: 11, fontWeight: '700', color: '#ccc', textTransform: 'uppercase', letterSpacing: 1, marginTop: 26, marginBottom: 10 },
  item: { backgroundColor: COLORS.bg, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 12, marginBottom: 8 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between' },
  itemTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  itemSub: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  empty: { color: COLORS.textLight, fontSize: 13 },
  fotos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  foto: { width: 64, height: 64, borderRadius: 8, backgroundColor: COLORS.surface },
  link: { color: COLORS.info, fontWeight: '600', marginTop: 8, fontSize: 14 },
  linkSmall: { color: COLORS.info, fontWeight: '600', marginTop: 8, fontSize: 13 },
  anular: { color: COLORS.danger, fontWeight: '600', marginTop: 6, fontSize: 12 },
  cancelLoan: { borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.danger, marginTop: 10 },
  cancelLoanText: { color: COLORS.danger, fontWeight: '700', fontSize: 14 },
  cancel: { textAlign: 'center', color: COLORS.textLight, marginTop: 24, fontSize: 14 },
})
