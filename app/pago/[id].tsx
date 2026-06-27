import { useEffect, useMemo, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getPrestamo } from '@/api/prestamos'
import { getConfigCartera } from '@/api/config'
import { ejecutar } from '@/lib/outbox'
import {
  capitalDeCuota,
  interesDeProximaCuota,
  desglosarPago,
  calcularMora,
  diasMora,
  type TipoPagoApp,
} from '@/lib/calculos'
import { enviarComprobante } from '@/lib/whatsapp'
import { Boton } from '@/components/Boton'
import { useFmt } from '@/lib/useFmt'
import { queryClient } from '@/lib/queryClient'
import { useSession } from '@/store/session'
import { exigirSuscripcion } from '@/lib/guard'
import { color as C, font, radius, shadowCard } from '@/theme'
import type { Frecuencia, ModeloInteres } from '@/types'

const TIPOS: { tipo: TipoPagoApp; label: string }[] = [
  { tipo: 'cuota_completa', label: 'Cuota completa' },
  { tipo: 'parcial', label: 'Parcial' },
  { tipo: 'solo_interes', label: 'Solo interés' },
  { tipo: 'abono_capital', label: 'Abono a capital' },
]

export default function RegistrarPago() {
  const router = useRouter()
  const f = useFmt()
  const moneda = useSession((s) => s.moneda)
  const carteraId = useSession((s) => s.carteraActivaId)
  const { id } = useLocalSearchParams<{ id: string }>()

  const { data: prestamo, isLoading } = useQuery({
    queryKey: ['prestamo', id],
    queryFn: () => getPrestamo(id),
    enabled: !!id,
  })

  const { data: config } = useQuery({
    queryKey: ['config', carteraId],
    queryFn: () => getConfigCartera(carteraId!),
    enabled: !!carteraId,
  })

  const [tipo, setTipo] = useState<TipoPagoApp>('cuota_completa')
  const [montoIngresado, setMontoIngresado] = useState('')
  const [mora, setMora] = useState('')
  const [moraTocada, setMoraTocada] = useState(false)

  // Pre-llena la mora sugerida según la configuración de la cartera (editable)
  useEffect(() => {
    if (!prestamo || moraTocada || config === undefined) return
    const atraso = diasMora(prestamo.fecha_proximo_pago)
    const capCuota = capitalDeCuota(Number(prestamo.monto_capital), prestamo.num_cuotas)
    const intCuota = interesDeProximaCuota({
      capital: Number(prestamo.monto_capital),
      tasa: Number(prestamo.tasa_interes),
      modelo: prestamo.modelo_interes as ModeloInteres,
      numCuotas: prestamo.num_cuotas,
      frecuencia: prestamo.frecuencia_cobro as Frecuencia,
      cuotasPagadas: prestamo.cuotas_pagadas,
    })
    const sugerida = calcularMora(config ?? null, atraso, {
      saldo: Number(prestamo.saldo_pendiente),
      capital: Number(prestamo.monto_capital),
      cuota: capCuota + intCuota,
    })
    if (sugerida > 0) setMora(String(sugerida))
  }, [prestamo, config, moraTocada])

  const desglose = useMemo(() => {
    if (!prestamo) return null
    const capCuota = capitalDeCuota(Number(prestamo.monto_capital), prestamo.num_cuotas)
    const intCuota = interesDeProximaCuota({
      capital: Number(prestamo.monto_capital),
      tasa: Number(prestamo.tasa_interes),
      modelo: prestamo.modelo_interes as ModeloInteres,
      numCuotas: prestamo.num_cuotas,
      frecuencia: prestamo.frecuencia_cobro as Frecuencia,
      cuotasPagadas: prestamo.cuotas_pagadas,
    })
    return desglosarPago({
      saldoAntes: Number(prestamo.saldo_pendiente),
      tipo,
      intCuota,
      capCuota,
      montoIngresado: parseFloat(montoIngresado) || 0,
      mora: parseFloat(mora) || 0,
    })
  }, [prestamo, tipo, montoIngresado, mora])

  const mut = useMutation({
    mutationFn: () => {
      const atraso = diasMora(prestamo!.fecha_proximo_pago)
      return ejecutar('registrarPago', {
        prestamo_id: prestamo!.id,
        cliente_id: prestamo!.cliente_id,
        fecha_pago: new Date().toISOString().slice(0, 10),
        tipo_pago: desglose!.tipo_pago,
        monto_total: desglose!.monto_total,
        monto_capital: desglose!.monto_capital,
        monto_interes: desglose!.monto_interes,
        monto_mora: desglose!.monto_mora,
        saldo_antes: desglose!.saldo_antes,
        saldo_despues: desglose!.saldo_despues,
        dias_atraso_al_pagar: atraso,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prestamos', carteraId] })
      queryClient.invalidateQueries({ queryKey: ['cobros-hoy', carteraId] })
      queryClient.invalidateQueries({ queryKey: ['metricas', carteraId] })
      queryClient.invalidateQueries({ queryKey: ['prestamo', id] })
      queryClient.invalidateQueries({ queryKey: ['pagos', id] })
      queryClient.invalidateQueries({ queryKey: ['caja', carteraId] })
      queryClient.invalidateQueries({ queryKey: ['caja-balance', carteraId] })
      const tel = prestamo?.clientes?.telefono
      if (tel) {
        Alert.alert('Pago registrado', '¿Enviar comprobante por WhatsApp?', [
          { text: 'No', style: 'cancel', onPress: () => router.back() },
          {
            text: 'Enviar',
            onPress: () => {
              enviarComprobante(tel, prestamo!.clientes!.nombre, desglose!.monto_total, moneda)
              router.back()
            },
          },
        ])
      } else {
        Alert.alert('Pago registrado', 'El saldo y la caja se actualizaron.')
        router.back()
      }
    },
    onError: (e: any) => Alert.alert('Error', e.message ?? 'No se pudo registrar el pago'),
  })

  function confirmar() {
    if (!desglose) return
    if (!exigirSuscripcion(router)) return
    if ((tipo === 'parcial' || tipo === 'abono_capital') && (parseFloat(montoIngresado) || 0) <= 0) {
      return Alert.alert('Monto inválido', 'Ingresa el monto a pagar')
    }
    if (desglose.monto_total <= 0) return Alert.alert('Nada que cobrar')
    mut.mutate()
  }

  if (isLoading || !prestamo || !desglose) {
    return <View style={s.center}><ActivityIndicator color={C.primary} /></View>
  }

  const atraso = diasMora(prestamo.fecha_proximo_pago)
  const pideMonto = tipo === 'parcial' || tipo === 'abono_capital'

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 20, paddingTop: 56 }}>
      <Text style={s.title}>Registrar pago</Text>
      <Text style={s.cliente}>{prestamo.clientes?.nombre ?? 'Cliente'}</Text>
      {atraso > 0 && <Text style={s.mora}>⚠️ {atraso} días de atraso</Text>}

      <Text style={s.label}>Tipo de pago</Text>
      <View style={s.chips}>
        {TIPOS.map((o) => (
          <TouchableOpacity key={o.tipo} style={[s.chip, tipo === o.tipo && s.chipSel]} onPress={() => setTipo(o.tipo)}>
            <Text style={[s.chipText, tipo === o.tipo && s.chipTextSel]}>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {pideMonto && (
        <>
          <Text style={s.label}>Monto a pagar</Text>
          <TextInput style={s.input} value={montoIngresado} onChangeText={setMontoIngresado} placeholder="0" placeholderTextColor="#bbb" keyboardType="numeric" />
        </>
      )}

      <View style={s.box}>
        <View style={s.row}><Text style={s.rowLabel}>Saldo actual</Text><Text style={s.rowVal}>{f(desglose.saldo_antes)}</Text></View>
        <View style={s.row}><Text style={s.rowLabel}>Capital</Text><Text style={s.rowVal}>{f(desglose.monto_capital)}</Text></View>
        <View style={s.row}><Text style={s.rowLabel}>Interés</Text><Text style={s.rowVal}>{f(desglose.monto_interes)}</Text></View>
        <View style={s.row}><Text style={s.rowLabel}>Mora</Text><Text style={s.rowVal}>{f(desglose.monto_mora)}</Text></View>
        <View style={[s.row, s.rowTotal]}><Text style={s.totalLabel}>Total a pagar</Text><Text style={s.totalVal}>{f(desglose.monto_total)}</Text></View>
        <View style={s.row}><Text style={s.rowLabel}>Saldo después</Text><Text style={s.rowVal}>{f(desglose.saldo_despues)}</Text></View>
      </View>

      <Text style={s.label}>Mora a cobrar</Text>
      <TextInput
        style={s.input}
        value={mora}
        onChangeText={(t) => { setMora(t); setMoraTocada(true) }}
        placeholder="0"
        placeholderTextColor="#bbb"
        keyboardType="numeric"
      />
      <Text style={s.hint}>
        {config?.aplica_mora
          ? `Sugerida automáticamente por la config de la cartera (${atraso} días de atraso). Puedes ajustarla.`
          : 'Mora manual. Actívala en Ajustes → Configuración de mora para calcularla sola.'}
      </Text>

      <Boton variant="success" icon="check-circle" label="Confirmar pago" loading={mut.isPending} onPress={confirmar} style={{ marginTop: 24 }} />
      <TouchableOpacity onPress={() => router.back()}><Text style={s.cancel}>Cancelar</Text></TouchableOpacity>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg },
  title: { fontFamily: font.display, fontSize: 24, color: C.ink, letterSpacing: -0.6 },
  cliente: { fontFamily: font.bodySemi, fontSize: 15, color: C.muted, marginTop: 4 },
  mora: { fontFamily: font.bodyBold, color: C.danger, marginTop: 6 },
  label: { fontFamily: font.bodyBold, fontSize: 11, color: C.faint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.md, backgroundColor: C.surface, ...shadowCard },
  chipSel: { backgroundColor: C.primary },
  chipText: { fontFamily: font.bodySemi, fontSize: 13, color: C.ink },
  chipTextSel: { color: '#fff' },
  input: { backgroundColor: C.surface, borderRadius: radius.md, padding: 14, fontFamily: font.body, fontSize: 15, color: C.ink, ...shadowCard },
  hint: { fontFamily: font.body, fontSize: 12, color: C.muted, marginTop: 6 },
  box: { backgroundColor: C.surface, borderRadius: radius.xl, padding: 16, marginTop: 18, ...shadowCard },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowLabel: { fontFamily: font.body, fontSize: 14, color: C.muted },
  rowVal: { fontFamily: font.bodySemi, fontSize: 14, color: C.ink, fontVariant: ['tabular-nums'] },
  rowTotal: { borderTopWidth: 1, borderTopColor: C.line, paddingTop: 8, marginTop: 4 },
  totalLabel: { fontFamily: font.displaySemi, fontSize: 15, color: C.ink },
  totalVal: { fontFamily: font.display, fontSize: 18, color: C.primary, fontVariant: ['tabular-nums'] },
  cancel: { fontFamily: font.bodySemi, textAlign: 'center', color: C.muted, marginTop: 16, fontSize: 14 },
})
