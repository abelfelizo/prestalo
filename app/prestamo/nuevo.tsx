import { useEffect, useMemo, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getClientes } from '@/api/clientes'
import { getPrestamo, editarPrestamo } from '@/api/prestamos'
import { calcularPrestamo, primeraFechaPago } from '@/lib/calculos'
import { ejecutar } from '@/lib/outbox'
import { Boton } from '@/components/Boton'
import { useFmt } from '@/lib/useFmt'
import { queryClient } from '@/lib/queryClient'
import { useSession } from '@/store/session'
import { color as C, font, radius, shadowCard } from '@/theme'
import type { Frecuencia, ModeloInteres } from '@/types'

const FRECUENCIAS: Frecuencia[] = ['diario', 'semanal', 'quincenal', 'mensual']

export default function NuevoPrestamo() {
  const router = useRouter()
  const f = useFmt()
  const carteraId = useSession((s) => s.carteraActivaId)
  const { id } = useLocalSearchParams<{ id?: string }>()
  const editando = !!id

  const { data: clientes } = useQuery({
    queryKey: ['clientes', carteraId],
    queryFn: () => getClientes(carteraId!),
    enabled: !!carteraId,
  })

  const [clienteId, setClienteId] = useState<string | null>(null)
  const [capital, setCapital] = useState('')
  const [tasa, setTasa] = useState('')
  const [modelo, setModelo] = useState<ModeloInteres>('flat')
  const [frecuencia, setFrecuencia] = useState<Frecuencia>('semanal')
  const [numCuotas, setNumCuotas] = useState('')

  const existente = useQuery({ queryKey: ['prestamo', id], queryFn: () => getPrestamo(id!), enabled: editando })
  useEffect(() => {
    const p = existente.data
    if (p) {
      setClienteId(p.cliente_id)
      setCapital(String(Number(p.monto_capital)))
      setTasa(String(Number(p.tasa_interes)))
      setModelo(p.modelo_interes as ModeloInteres)
      setFrecuencia(p.frecuencia_cobro as Frecuencia)
      setNumCuotas(String(p.num_cuotas))
    }
  }, [existente.data])

  const cap = parseFloat(capital) || 0
  const t = parseFloat(tasa) || 0
  const n = parseInt(numCuotas, 10) || 0

  const resumen = useMemo(() => calcularPrestamo(cap, t, modelo, n, frecuencia), [cap, t, modelo, n, frecuencia])

  const mut = useMutation({
    mutationFn: () => {
      const fechaInicio = existente.data?.fecha_inicio ?? new Date().toISOString().slice(0, 10)
      const datos = {
        cartera_id: carteraId!,
        cliente_id: clienteId!,
        monto_capital: cap,
        saldo_pendiente: resumen.montoTotal,
        tasa_interes: t,
        modelo_interes: modelo,
        frecuencia_cobro: frecuencia,
        num_cuotas: n,
        fecha_inicio: fechaInicio,
        fecha_proximo_pago: primeraFechaPago(fechaInicio, frecuencia),
        estado: 'activo' as const,
      }
      return editando
        ? editarPrestamo(id!, datos).then(() => ({ encolado: false }))
        : ejecutar('crearPrestamo', datos)
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['prestamos', carteraId] })
      queryClient.invalidateQueries({ queryKey: ['metricas', carteraId] })
      queryClient.invalidateQueries({ queryKey: ['caja', carteraId] })
      queryClient.invalidateQueries({ queryKey: ['caja-balance', carteraId] })
      if (editando) queryClient.invalidateQueries({ queryKey: ['prestamo', id] })
      if (res?.encolado) Alert.alert('Sin conexión', 'El préstamo se guardó y se enviará al recuperar internet.')
      router.back()
    },
    onError: (e: any) => Alert.alert('Error', e.message ?? 'No se pudo guardar el préstamo'),
  })

  function guardar() {
    if (!clienteId) return Alert.alert('Selecciona un cliente')
    if (cap <= 0) return Alert.alert('Capital inválido')
    if (n <= 0) return Alert.alert('Número de cuotas inválido')
    mut.mutate()
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 20, paddingTop: 56 }}>
      <Text style={s.title}>{editando ? 'Editar préstamo' : 'Nuevo préstamo'}</Text>

      <Text style={s.label}>Cliente *</Text>
      {(clientes ?? []).length === 0 ? (
        <Text style={s.hint}>No hay clientes. Crea uno primero.</Text>
      ) : (
        <View style={s.chips}>
          {(clientes ?? []).map((c) => (
            <TouchableOpacity key={c.id} style={[s.chip, clienteId === c.id && s.chipSel]} onPress={() => setClienteId(c.id)}>
              <Text style={[s.chipText, clienteId === c.id && s.chipTextSel]}>{c.nombre}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={s.label}>Capital *</Text>
      <TextInput style={s.input} value={capital} onChangeText={setCapital} placeholder="0" placeholderTextColor="#bbb" keyboardType="numeric" />

      <Text style={s.label}>{modelo === 'flat' ? 'Tasa de interés (% total)' : 'Tasa de interés (% mensual)'}</Text>
      <TextInput style={s.input} value={tasa} onChangeText={setTasa} placeholder="0" placeholderTextColor="#bbb" keyboardType="numeric" />
      <Text style={s.hint}>
        {modelo === 'flat'
          ? 'Flat: interés total una sola vez sobre el capital.'
          : 'Sobre saldo: tasa mensual, prorrateada al período, sobre el saldo que baja.'}
      </Text>

      <Text style={s.label}>Modelo de interés</Text>
      <View style={s.chips}>
        {(['flat', 'sobre_saldo'] as ModeloInteres[]).map((m) => (
          <TouchableOpacity key={m} style={[s.chip, modelo === m && s.chipSel]} onPress={() => setModelo(m)}>
            <Text style={[s.chipText, modelo === m && s.chipTextSel]}>{m === 'flat' ? 'Flat' : 'Sobre saldo'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>Frecuencia de cobro</Text>
      <View style={s.chips}>
        {FRECUENCIAS.map((fr) => (
          <TouchableOpacity key={fr} style={[s.chip, frecuencia === fr && s.chipSel]} onPress={() => setFrecuencia(fr)}>
            <Text style={[s.chipText, frecuencia === fr && s.chipTextSel]}>{fr}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>Número de cuotas *</Text>
      <TextInput style={s.input} value={numCuotas} onChangeText={setNumCuotas} placeholder="0" placeholderTextColor="#bbb" keyboardType="numeric" />

      {n > 0 && cap > 0 && (
        <View style={s.preview}>
          <Text style={s.previewTitle}>Resumen</Text>
          <View style={s.previewRow}><Text style={s.previewLabel}>Total a cobrar</Text><Text style={s.previewVal}>{f(resumen.montoTotal)}</Text></View>
          <View style={s.previewRow}><Text style={s.previewLabel}>Interés</Text><Text style={s.previewVal}>{f(resumen.interesTotal)}</Text></View>
          <View style={s.previewRow}><Text style={s.previewLabel}>Cuota ({frecuencia})</Text><Text style={[s.previewVal, { color: C.cyanLight }]}>{f(resumen.cuota)}</Text></View>
        </View>
      )}

      <Boton icon="check" label={editando ? 'Guardar cambios' : 'Crear préstamo'} loading={mut.isPending} onPress={guardar} style={{ marginTop: 24 }} />
      <TouchableOpacity onPress={() => router.back()}><Text style={s.cancel}>Cancelar</Text></TouchableOpacity>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  title: { fontFamily: font.display, fontSize: 24, color: C.ink, letterSpacing: -0.6, marginBottom: 16 },
  label: { fontFamily: font.bodyBold, fontSize: 11, color: C.faint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  hint: { fontFamily: font.body, color: C.muted, fontSize: 13 },
  input: { backgroundColor: C.surface, borderRadius: radius.md, padding: 14, fontFamily: font.body, fontSize: 15, color: C.ink, ...shadowCard },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.md, backgroundColor: C.surface, ...shadowCard },
  chipSel: { backgroundColor: C.primary },
  chipText: { fontFamily: font.bodySemi, fontSize: 13, color: C.ink },
  chipTextSel: { color: '#fff' },
  preview: { backgroundColor: C.primaryDark, borderRadius: radius.xl, padding: 18, marginTop: 22 },
  previewTitle: { fontFamily: font.bodyBold, fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  previewLabel: { fontFamily: font.body, fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  previewVal: { fontFamily: font.displaySemi, fontSize: 15, color: '#fff', fontVariant: ['tabular-nums'] },
  cancel: { fontFamily: font.bodySemi, textAlign: 'center', color: C.muted, marginTop: 16, fontSize: 14 },
})
