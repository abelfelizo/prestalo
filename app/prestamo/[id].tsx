import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { errMsg } from '@/lib/errores'
import { Feather } from '@expo/vector-icons'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { getPrestamo, otorgarProrroga, cancelarPrestamo } from '@/api/prestamos'
import { getPagosDePrestamo, anularPago } from '@/api/pagos'
import { getGarantias, devolverGarantia, eliminarGarantia } from '@/api/garantias'
import { getConfigCartera } from '@/api/config'
import { primeraFechaPago, calendarioPrestamo } from '@/lib/calculos'
import { useFmt } from '@/lib/useFmt'
import { useSession } from '@/store/session'
import { queryClient } from '@/lib/queryClient'
import { cobrarPorWhatsApp } from '@/lib/whatsapp'
import { usePinPrompt } from '@/store/pinPrompt'
import { LinearGradient } from 'expo-linear-gradient'
import { color as C, font, radius, shadowCard, shadowRaised, gradient } from '@/theme'
import type { Frecuencia } from '@/types'

export default function DetallePrestamo() {
  const router = useRouter()
  const f = useFmt()
  const moneda = useSession((s) => s.moneda)
  const carteraId = useSession((s) => s.carteraActivaId)
  const pedirPin = usePinPrompt((s) => s.pedirPin)
  const { id } = useLocalSearchParams<{ id: string }>()

  const prestamo = useQuery({ queryKey: ['prestamo', id], queryFn: () => getPrestamo(id), enabled: !!id })
  const pagos = useQuery({ queryKey: ['pagos', id], queryFn: () => getPagosDePrestamo(id), enabled: !!id })
  const garantias = useQuery({ queryKey: ['garantias', id], queryFn: () => getGarantias(id), enabled: !!id })
  const config = useQuery({ queryKey: ['config', carteraId], queryFn: () => getConfigCartera(carteraId!), enabled: !!carteraId })

  if (prestamo.isLoading || !prestamo.data) {
    return <View style={s.center}><ActivityIndicator color={C.primary} /></View>
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
            Alert.alert('Error', errMsg(e, 'No se pudo otorgar la prórroga'))
          }
        },
      },
    ])
  }

  function cancelar() {
    pedirPin(async () => {
      try {
        await cancelarPrestamo(p.id)
        refrescarTodo()
        router.back()
      } catch (e: any) {
        Alert.alert('Error', errMsg(e, 'No se pudo cancelar'))
      }
    }, 'PIN para cancelar el préstamo')
  }

  function anular(pagoId: string) {
    pedirPin(async () => {
      try {
        await anularPago(pagoId)
        refrescarTodo()
      } catch (e: any) {
        Alert.alert('Error', errMsg(e, 'No se pudo anular'))
      }
    }, 'PIN para anular el pago')
  }

  async function devolver(garantiaId: string) {
    try {
      await devolverGarantia(garantiaId)
      queryClient.invalidateQueries({ queryKey: ['garantias', id] })
    } catch (e: any) {
      Alert.alert('Error', errMsg(e, 'No se pudo actualizar'))
    }
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 20, paddingTop: 56 }}>
      <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
        <Feather name="chevron-left" size={20} color={C.ink} />
      </TouchableOpacity>
      <Text style={s.cliente}>{p.clientes?.nombre ?? 'Cliente'}</Text>
      <View style={[s.pill, p.estado === 'en_mora' && s.pillR, p.estado === 'activo' && s.pillG]}>
        <Text style={[s.pillText, p.estado === 'en_mora' && { color: C.danger }, p.estado === 'activo' && { color: C.success }]}>{p.estado}</Text>
      </View>

      <View style={s.box}>
        <Row label="Saldo pendiente" val={f(p.saldo_pendiente)} />
        <Row label="Capital" val={f(p.monto_capital)} />
        <Row label="Tasa" val={`${p.tasa_interes}% (${p.modelo_interes})`} />
        <Row label="Cuotas" val={`${p.cuotas_pagadas}/${p.num_cuotas} (${p.frecuencia_cobro})`} />
        <Row label="Próximo pago" val={p.fecha_proximo_pago} />
        {p.dias_en_mora > 0 && <Row label="Días en mora" val={String(p.dias_en_mora)} />}
      </View>

      <TouchableOpacity activeOpacity={0.9} onPress={() => router.push(`/pago/${p.id}`)} style={s.primaryWrap}>
        <LinearGradient colors={gradient.buttonSuccess} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.primaryBtn}>
          <Feather name="check-circle" size={18} color="#fff" />
          <Text style={s.primaryText}>Registrar pago</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={s.tiles}>
        {!!p.clientes?.telefono && (
          <TouchableOpacity style={s.tile} activeOpacity={0.8} onPress={() => cobrarPorWhatsApp(p.clientes!.telefono!, p.clientes!.nombre, Number(p.saldo_pendiente), moneda, config.data?.mensaje_mora_whatsapp)}>
            <View style={[s.tileIcon, { backgroundColor: '#E7F9EF' }]}><Feather name="message-circle" size={18} color={C.whatsapp} /></View>
            <Text style={s.tileText}>Cobrar</Text>
          </TouchableOpacity>
        )}
        {activo && (
          <TouchableOpacity style={s.tile} activeOpacity={0.8} onPress={prorrogar}>
            <View style={s.tileIcon}><Feather name="clock" size={18} color={C.primary} /></View>
            <Text style={s.tileText}>Prórroga</Text>
          </TouchableOpacity>
        )}
        {activo && (
          <TouchableOpacity style={s.tile} activeOpacity={0.8} onPress={() => router.push(`/prestamo/refinanciar?id=${p.id}`)}>
            <View style={s.tileIcon}><Feather name="refresh-cw" size={18} color={C.primary} /></View>
            <Text style={s.tileText}>Refinanciar</Text>
          </TouchableOpacity>
        )}
      </View>

      {activo && p.cuotas_pagadas === 0 && (
        <TouchableOpacity style={s.ghost} onPress={() => router.push(`/prestamo/nuevo?id=${p.id}`)} activeOpacity={0.8}>
          <Feather name="edit-2" size={15} color={C.ink} />
          <Text style={s.ghostText}>Editar préstamo</Text>
        </TouchableOpacity>
      )}
      {activo && (
        <TouchableOpacity style={s.ghostDanger} onPress={cancelar} activeOpacity={0.8}>
          <Text style={s.ghostDangerText}>Cancelar préstamo</Text>
        </TouchableOpacity>
      )}

      <Text style={s.section}>Calendario de pagos</Text>
      {calendarioPrestamo(p).map((c) => (
        <View key={c.numero} style={s.cuota}>
          <View style={[s.cuotaIcon, { backgroundColor: c.pagada ? C.successTint : C.indigoTint }]}>
            {c.pagada ? <Feather name="check" size={15} color={C.success} /> : <Text style={s.cuotaNumIcon}>{c.numero}</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cuotaTitle}>Cuota {c.numero}</Text>
            <Text style={s.cuotaFecha}>{c.fecha}</Text>
          </View>
          <Text style={[s.cuotaMonto, c.pagada && s.cuotaMontoPagada]}>{f(c.monto)}</Text>
        </View>
      ))}

      <Text style={s.section}>Garantías</Text>
      {(garantias.data ?? []).length === 0 ? (
        <Text style={s.empty}>Sin garantías</Text>
      ) : (
        (garantias.data ?? []).map((g) => (
          <View key={g.id} style={s.item}>
            <Text style={s.itemTitle}>{g.tipo}</Text>
            {!!g.descripcion && <Text style={s.itemSub}>{g.descripcion}</Text>}
            <Text style={s.itemSub}>{g.estado}</Text>
            <View style={s.gRow}>
              <TouchableOpacity onPress={() => router.push(`/garantia/nueva?prestamoId=${p.id}&id=${g.id}`)}>
                <Text style={s.linkSmall}>Editar</Text>
              </TouchableOpacity>
              {g.estado === 'en_poder' && (
                <TouchableOpacity onPress={() => devolver(g.id)}>
                  <Text style={s.linkSmall}>Marcar como devuelta</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() =>
                  pedirPin(async () => {
                    await eliminarGarantia(g.id)
                    queryClient.invalidateQueries({ queryKey: ['garantias', id] })
                  }, 'PIN para eliminar la garantía')
                }
              >
                <Text style={s.anular}>Eliminar</Text>
              </TouchableOpacity>
            </View>
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
          <TouchableOpacity key={pg.id} style={s.item} activeOpacity={0.7} delayLongPress={600} onLongPress={() => anular(pg.id)}>
            <View style={s.itemRow}>
              <Text style={s.itemTitle}>{f(pg.monto_total)}</Text>
              <Text style={s.itemSub}>{pg.fecha_pago}</Text>
            </View>
            <Text style={s.itemSub}>
              Capital {f(pg.monto_capital)} · Interés {f(pg.monto_interes)}
              {Number(pg.monto_mora) > 0 ? ` · Mora ${f(pg.monto_mora)}` : ''}
            </Text>
            <Text style={s.anularHint}>Mantén presionado para anular</Text>
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
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  backBtn: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 12, ...shadowCard },
  cliente: { fontFamily: font.display, fontSize: 24, color: C.ink, letterSpacing: -0.6 },
  pill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 5, borderRadius: radius.sm, backgroundColor: C.indigoTint, marginTop: 8 },
  pillR: { backgroundColor: C.dangerTint },
  pillG: { backgroundColor: C.successTint },
  pillText: { fontFamily: font.bodyBold, fontSize: 11, color: C.primary },
  box: { backgroundColor: C.surface, borderRadius: radius.xl, padding: 16, marginTop: 16, ...shadowCard },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowLabel: { fontFamily: font.body, fontSize: 14, color: C.muted },
  rowVal: { fontFamily: font.bodyBold, fontSize: 14, color: C.ink, fontVariant: ['tabular-nums'] },
  primaryWrap: { marginTop: 16, ...shadowRaised },
  primaryBtn: { borderRadius: radius.lg, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryText: { fontFamily: font.bodyBold, color: '#fff', fontSize: 15 },
  tiles: { flexDirection: 'row', gap: 10, marginTop: 12 },
  tile: { flex: 1, backgroundColor: C.surface, borderRadius: radius.lg, paddingVertical: 14, alignItems: 'center', gap: 8, ...shadowCard },
  tileIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.indigoTint, alignItems: 'center', justifyContent: 'center' },
  tileText: { fontFamily: font.bodySemi, fontSize: 12.5, color: C.ink },
  ghost: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.surface, borderRadius: radius.md, padding: 13, marginTop: 12, ...shadowCard },
  ghostText: { fontFamily: font.bodyBold, color: C.ink, fontSize: 14 },
  ghostDanger: { alignItems: 'center', justifyContent: 'center', backgroundColor: C.dangerTint, borderRadius: radius.md, padding: 13, marginTop: 10 },
  ghostDangerText: { fontFamily: font.bodyBold, color: C.danger, fontSize: 14 },
  section: { fontFamily: font.displaySemi, fontSize: 14, color: C.ink, marginTop: 26, marginBottom: 12 },
  cuota: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: C.surface, borderRadius: radius.lg, paddingVertical: 12, paddingHorizontal: 13, marginBottom: 8, ...shadowCard },
  cuotaIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  cuotaNumIcon: { fontFamily: font.bodyBold, fontSize: 13, color: C.primary },
  cuotaTitle: { fontFamily: font.bodyBold, fontSize: 14, color: C.ink },
  cuotaFecha: { fontFamily: font.body, fontSize: 12, color: C.muted, marginTop: 2 },
  cuotaMonto: { fontFamily: font.displaySemi, fontSize: 14, color: C.ink, fontVariant: ['tabular-nums'] },
  cuotaMontoPagada: { color: C.faint, textDecorationLine: 'line-through' },
  item: { backgroundColor: C.surface, borderRadius: radius.lg, padding: 13, marginBottom: 8, ...shadowCard },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between' },
  itemTitle: { fontFamily: font.displaySemi, fontSize: 14, color: C.ink },
  itemSub: { fontFamily: font.body, fontSize: 12, color: C.muted, marginTop: 2 },
  empty: { fontFamily: font.body, color: C.muted, fontSize: 13 },
  link: { fontFamily: font.bodySemi, color: C.primary, marginTop: 8, fontSize: 14 },
  linkSmall: { fontFamily: font.bodySemi, color: C.primary, marginTop: 8, fontSize: 13 },
  gRow: { flexDirection: 'row', gap: 16, marginTop: 8, alignItems: 'center' },
  anular: { fontFamily: font.bodySemi, color: C.danger, marginTop: 6, fontSize: 12 },
  anularHint: { fontFamily: font.body, color: C.faint, fontSize: 10, marginTop: 6 },
  editLoan: { borderRadius: radius.md, padding: 13, alignItems: 'center', backgroundColor: C.surface, marginTop: 10, ...shadowCard },
  editLoanText: { fontFamily: font.bodyBold, color: C.ink, fontSize: 14 },
  cancelLoan: { borderRadius: radius.md, padding: 13, alignItems: 'center', backgroundColor: C.dangerTint, borderWidth: 1.5, borderColor: C.danger, marginTop: 10 },
  cancelLoanText: { fontFamily: font.bodyBold, color: C.danger, fontSize: 14 },
  cancel: { fontFamily: font.bodySemi, textAlign: 'center', color: C.muted, marginTop: 24, fontSize: 14 },
})
