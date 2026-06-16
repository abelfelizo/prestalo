import { useMemo, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getPrestamo } from '@/api/prestamos'
import { registrarPago } from '@/api/pagos'
import { calcularPrestamo, desglosarCuota, diasMora, fmt } from '@/lib/calculos'
import { enviarComprobante } from '@/lib/whatsapp'
import { queryClient } from '@/lib/queryClient'
import { useSession } from '@/store/session'
import { COLORS } from '@/lib/constants'
import type { ModeloInteres } from '@/types'

export default function RegistrarPago() {
  const router = useRouter()
  const carteraId = useSession((s) => s.carteraActivaId)
  const { id } = useLocalSearchParams<{ id: string }>()

  const { data: prestamo, isLoading } = useQuery({
    queryKey: ['prestamo', id],
    queryFn: () => getPrestamo(id),
    enabled: !!id,
  })

  const [mora, setMora] = useState('')

  const desglose = useMemo(() => {
    if (!prestamo) return null
    const { interesTotal } = calcularPrestamo(
      Number(prestamo.monto_capital),
      Number(prestamo.tasa_interes),
      prestamo.modelo_interes as ModeloInteres,
      prestamo.num_cuotas,
    )
    return desglosarCuota(
      Number(prestamo.saldo_pendiente),
      Number(prestamo.monto_capital),
      interesTotal,
      prestamo.num_cuotas,
      parseFloat(mora) || 0,
    )
  }, [prestamo, mora])

  const mut = useMutation({
    mutationFn: () => {
      const atraso = diasMora(prestamo!.fecha_proximo_pago)
      return registrarPago({
        prestamo_id: prestamo!.id,
        cliente_id: prestamo!.cliente_id,
        fecha_pago: new Date().toISOString().slice(0, 10),
        tipo_pago: 'cuota_completa',
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
      const tel = prestamo?.clientes?.telefono
      if (tel) {
        Alert.alert('Pago registrado', '¿Enviar comprobante por WhatsApp?', [
          { text: 'No', style: 'cancel', onPress: () => router.back() },
          {
            text: 'Enviar',
            onPress: () => {
              enviarComprobante(tel, prestamo!.clientes!.nombre, desglose!.monto_total, 'RD$')
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

  if (isLoading || !prestamo || !desglose) {
    return <View style={s.center}><ActivityIndicator color={COLORS.primary} /></View>
  }

  const atraso = diasMora(prestamo.fecha_proximo_pago)

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 20, paddingTop: 56 }}>
      <Text style={s.title}>Registrar pago</Text>
      <Text style={s.cliente}>{prestamo.clientes?.nombre ?? 'Cliente'}</Text>
      {atraso > 0 && <Text style={s.mora}>⚠️ {atraso} días de atraso</Text>}

      <View style={s.box}>
        <View style={s.row}><Text style={s.rowLabel}>Saldo actual</Text><Text style={s.rowVal}>{fmt(desglose.saldo_antes)}</Text></View>
        <View style={s.row}><Text style={s.rowLabel}>Capital</Text><Text style={s.rowVal}>{fmt(desglose.monto_capital)}</Text></View>
        <View style={s.row}><Text style={s.rowLabel}>Interés</Text><Text style={s.rowVal}>{fmt(desglose.monto_interes)}</Text></View>
        <View style={s.row}><Text style={s.rowLabel}>Mora</Text><Text style={s.rowVal}>{fmt(desglose.monto_mora)}</Text></View>
        <View style={[s.row, s.rowTotal]}><Text style={s.totalLabel}>Total a pagar</Text><Text style={s.totalVal}>{fmt(desglose.monto_total)}</Text></View>
        <View style={s.row}><Text style={s.rowLabel}>Saldo después</Text><Text style={s.rowVal}>{fmt(desglose.saldo_despues)}</Text></View>
      </View>

      <Text style={s.label}>Mora a cobrar (opcional)</Text>
      <TextInput style={s.input} value={mora} onChangeText={setMora} placeholder="0" placeholderTextColor="#bbb" keyboardType="numeric" />

      <TouchableOpacity style={s.btn} onPress={() => mut.mutate()} disabled={mut.isPending}>
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
  box: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, marginTop: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  rowLabel: { fontSize: 14, color: COLORS.textLight },
  rowVal: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  rowTotal: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 8, marginTop: 4 },
  totalLabel: { fontSize: 15, fontWeight: '800', color: COLORS.text },
  totalVal: { fontSize: 17, fontWeight: '800', color: COLORS.gold },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, marginTop: 18 },
  input: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, fontSize: 15, color: COLORS.text, borderWidth: 1.5, borderColor: COLORS.border },
  btn: { backgroundColor: COLORS.success, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24 },
  btnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  cancel: { textAlign: 'center', color: COLORS.textLight, marginTop: 16, fontSize: 14 },
})
