import { useEffect, useMemo, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getPrestamo } from '@/api/prestamos'
import { registrarPago } from '@/api/pagos'
import { getConfigCartera } from '@/api/config'
import {
  capitalDeCuota,
  interesDeProximaCuota,
  desglosarPago,
  calcularMora,
  diasMora,
  type TipoPagoApp,
} from '@/lib/calculos'
import { enviarComprobante } from '@/lib/whatsapp'
import { useFmt } from '@/lib/useFmt'
import { queryClient } from '@/lib/queryClient'
import { useSession } from '@/store/session'
import { COLORS } from '@/lib/constants'
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
      return registrarPago({
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
    if ((tipo === 'parcial' || tipo === 'abono_capital') && (parseFloat(montoIngresado) || 0) <= 0) {
      return Alert.alert('Monto inválido', 'Ingresa el monto a pagar')
    }
    if (desglose.monto_total <= 0) return Alert.alert('Nada que cobrar')
    mut.mutate()
  }

  if (isLoading || !prestamo || !desglose) {
    return <View style={s.center}><ActivityIndicator color={COLORS.primary} /></View>
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

      <TouchableOpacity style={s.btn} onPress={confirmar} disabled={mut.isPending}>
        {mut.isPending ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Confirmar pago</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.back()}><Text style={s.cancel}>Cancelar</Text></TouchableOpacity>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.primary },
  cliente: { fontSize: 16, color: COLORS.text, fontWeight: '600', marginTop: 4 },
  mora: { color: COLORS.danger, fontWeight: '700', marginTop: 6 },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, marginTop: 18 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  chipSel: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.text, fontWeight: '600' },
  chipTextSel: { color: '#fff' },
  input: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, fontSize: 15, color: COLORS.text, borderWidth: 1.5, borderColor: COLORS.border },
  hint: { fontSize: 12, color: COLORS.textLight, marginTop: 6 },
  box: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, marginTop: 18 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowLabel: { fontSize: 14, color: COLORS.textLight },
  rowVal: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  rowTotal: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 8, marginTop: 4 },
  totalLabel: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  totalVal: { fontSize: 17, fontWeight: '800', color: COLORS.gold },
  btn: { backgroundColor: COLORS.success, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24 },
  btnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  cancel: { textAlign: 'center', color: COLORS.textLight, marginTop: 16, fontSize: 14 },
})
