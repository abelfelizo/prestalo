import { useMemo, useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getPrestamo, crearPrestamo, marcarRefinanciado } from '@/api/prestamos'
import { calcularPrestamo, primeraFechaPago } from '@/lib/calculos'
import { useFmt } from '@/lib/useFmt'
import { queryClient } from '@/lib/queryClient'
import { Boton } from '@/components/Boton'
import { useSession } from '@/store/session'
import { color as COLORS, font, radius, shadowCard } from '@/theme'
import type { Frecuencia, ModeloInteres } from '@/types'

const FRECUENCIAS: Frecuencia[] = ['diario', 'semanal', 'quincenal', 'mensual']

export default function Refinanciar() {
  const router = useRouter()
  const f = useFmt()
  const carteraId = useSession((s) => s.carteraActivaId)
  const { id } = useLocalSearchParams<{ id: string }>()

  const { data: viejo, isLoading } = useQuery({ queryKey: ['prestamo', id], queryFn: () => getPrestamo(id), enabled: !!id })

  const [capital, setCapital] = useState('')
  const [tasa, setTasa] = useState('')
  const [modelo, setModelo] = useState<ModeloInteres>('flat')
  const [frecuencia, setFrecuencia] = useState<Frecuencia>('semanal')
  const [numCuotas, setNumCuotas] = useState('')

  // Pre-llenar el capital nuevo con el saldo pendiente del préstamo viejo
  useEffect(() => {
    if (viejo) {
      setCapital(String(Number(viejo.saldo_pendiente)))
      setModelo(viejo.modelo_interes as ModeloInteres)
      setFrecuencia(viejo.frecuencia_cobro as Frecuencia)
    }
  }, [viejo])

  const cap = parseFloat(capital) || 0
  const t = parseFloat(tasa) || 0
  const n = parseInt(numCuotas, 10) || 0
  const resumen = useMemo(() => calcularPrestamo(cap, t, modelo, n, frecuencia), [cap, t, modelo, n, frecuencia])

  const mut = useMutation({
    mutationFn: async () => {
      const fechaInicio = new Date().toISOString().slice(0, 10)
      await crearPrestamo({
        cartera_id: viejo!.cartera_id,
        cliente_id: viejo!.cliente_id,
        prestamo_padre_id: viejo!.id,
        monto_capital: cap,
        saldo_pendiente: resumen.montoTotal,
        tasa_interes: t,
        modelo_interes: modelo,
        frecuencia_cobro: frecuencia,
        num_cuotas: n,
        fecha_inicio: fechaInicio,
        fecha_proximo_pago: primeraFechaPago(fechaInicio, frecuencia),
        estado: 'activo',
      })
      await marcarRefinanciado(viejo!.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prestamos', carteraId] })
      queryClient.invalidateQueries({ queryKey: ['metricas', carteraId] })
      queryClient.invalidateQueries({ queryKey: ['caja', carteraId] })
      queryClient.invalidateQueries({ queryKey: ['caja-balance', carteraId] })
      queryClient.invalidateQueries({ queryKey: ['prestamo', id] })
      Alert.alert('Refinanciado', 'Se creó el préstamo nuevo y el anterior quedó cerrado.')
      router.back()
    },
    onError: (e: any) => Alert.alert('Error', e.message ?? 'No se pudo refinanciar'),
  })

  function guardar() {
    if (cap <= 0) return Alert.alert('Capital inválido')
    if (n <= 0) return Alert.alert('Número de cuotas inválido')
    mut.mutate()
  }

  if (isLoading || !viejo) return <View style={s.center}><ActivityIndicator color={COLORS.primary} /></View>

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 20, paddingTop: 56 }}>
      <Text style={s.title}>Refinanciar</Text>
      <Text style={s.sub}>{viejo.clientes?.nombre} · saldo actual {f(viejo.saldo_pendiente)}</Text>

      <Text style={s.label}>Capital del nuevo préstamo</Text>
      <TextInput style={s.input} value={capital} onChangeText={setCapital} placeholder="0" placeholderTextColor="#bbb" keyboardType="numeric" />

      <Text style={s.label}>{modelo === 'flat' ? 'Tasa (% total)' : 'Tasa (% mensual)'}</Text>
      <TextInput style={s.input} value={tasa} onChangeText={setTasa} placeholder="0" placeholderTextColor="#bbb" keyboardType="numeric" />

      <Text style={s.label}>Modelo</Text>
      <View style={s.chips}>
        {(['flat', 'sobre_saldo'] as ModeloInteres[]).map((m) => (
          <TouchableOpacity key={m} style={[s.chip, modelo === m && s.chipSel]} onPress={() => setModelo(m)}>
            <Text style={[s.chipText, modelo === m && s.chipTextSel]}>{m === 'flat' ? 'Flat' : 'Sobre saldo'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>Frecuencia</Text>
      <View style={s.chips}>
        {FRECUENCIAS.map((fr) => (
          <TouchableOpacity key={fr} style={[s.chip, frecuencia === fr && s.chipSel]} onPress={() => setFrecuencia(fr)}>
            <Text style={[s.chipText, frecuencia === fr && s.chipTextSel]}>{fr}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>Número de cuotas</Text>
      <TextInput style={s.input} value={numCuotas} onChangeText={setNumCuotas} placeholder="0" placeholderTextColor="#bbb" keyboardType="numeric" />

      {n > 0 && cap > 0 && (
        <View style={s.preview}>
          <View style={s.previewRow}><Text style={s.previewLabel}>Total a cobrar</Text><Text style={s.previewVal}>{f(resumen.montoTotal)}</Text></View>
          <View style={s.previewRow}><Text style={s.previewLabel}>Cuota</Text><Text style={[s.previewVal, { color: COLORS.cyanLight }]}>{f(resumen.cuota)}</Text></View>
        </View>
      )}

      <Boton icon="refresh-cw" label="Refinanciar" loading={mut.isPending} onPress={guardar} style={{ marginTop: 24 }} />
      <TouchableOpacity onPress={() => router.back()}><Text style={s.cancel}>Cancelar</Text></TouchableOpacity>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
  title: { fontFamily: font.display, fontSize: 24, color: COLORS.ink, letterSpacing: -0.6 },
  sub: { fontFamily: font.body, fontSize: 14, color: COLORS.muted, marginTop: 4, marginBottom: 8 },
  label: { fontFamily: font.bodyBold, fontSize: 11, color: COLORS.faint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: COLORS.surface, borderRadius: radius.md, padding: 14, fontFamily: font.body, fontSize: 15, color: COLORS.ink, ...shadowCard },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.md, backgroundColor: COLORS.surface, ...shadowCard },
  chipSel: { backgroundColor: COLORS.primary },
  chipText: { fontFamily: font.bodySemi, fontSize: 13, color: COLORS.ink },
  chipTextSel: { color: '#fff' },
  preview: { backgroundColor: COLORS.primaryDark, borderRadius: radius.xl, padding: 18, marginTop: 20 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  previewLabel: { fontFamily: font.body, fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  previewVal: { fontFamily: font.displaySemi, fontSize: 15, color: '#fff', fontVariant: ['tabular-nums'] },
  cancel: { fontFamily: font.bodySemi, textAlign: 'center', color: COLORS.muted, marginTop: 16, fontSize: 14 },
})
