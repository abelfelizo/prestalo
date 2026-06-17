import { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { editarMovimiento, getMovimiento } from '@/api/caja'
import { ejecutar } from '@/lib/outbox'
import { queryClient } from '@/lib/queryClient'
import { useSession } from '@/store/session'
import { COLORS } from '@/lib/constants'

type Opcion = { tipo: 'entrada' | 'salida'; categoria: string; label: string }
const OPCIONES: Opcion[] = [
  { tipo: 'entrada', categoria: 'capital_nuevo', label: 'Agregar capital' },
  { tipo: 'salida', categoria: 'retiro_personal', label: 'Retiro personal' },
  { tipo: 'entrada', categoria: 'otro', label: 'Otro ingreso' },
  { tipo: 'salida', categoria: 'otro', label: 'Otro gasto' },
]

export default function NuevoMovimiento() {
  const router = useRouter()
  const carteraId = useSession((s) => s.carteraActivaId)
  const { id } = useLocalSearchParams<{ id?: string }>()
  const editando = !!id

  const [sel, setSel] = useState<Opcion>(OPCIONES[0])
  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')

  const existente = useQuery({ queryKey: ['movimiento', id], queryFn: () => getMovimiento(id!), enabled: editando })
  useEffect(() => {
    const m = existente.data
    if (m) {
      setSel(OPCIONES.find((o) => o.tipo === m.tipo && o.categoria === m.categoria) ?? OPCIONES[0])
      setMonto(String(m.monto))
      setDescripcion(m.descripcion ?? '')
    }
  }, [existente.data])

  const mut = useMutation({
    mutationFn: () => {
      const payload = {
        cartera_id: carteraId!,
        tipo: sel.tipo,
        categoria: sel.categoria,
        monto: parseFloat(monto) || 0,
        descripcion: descripcion.trim() || null,
        fecha: new Date().toISOString().slice(0, 10),
      }
      return editando
        ? editarMovimiento(id!, payload).then(() => ({ encolado: false }))
        : ejecutar('crearMovimiento', payload)
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['caja', carteraId] })
      queryClient.invalidateQueries({ queryKey: ['caja-balance', carteraId] })
      if (res?.encolado) Alert.alert('Sin conexión', 'El movimiento se guardó y se enviará al recuperar internet.')
      router.back()
    },
    onError: (e: any) => Alert.alert('Error', e.message ?? 'No se pudo registrar'),
  })

  function guardar() {
    if ((parseFloat(monto) || 0) <= 0) return Alert.alert('Monto inválido')
    mut.mutate()
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 20, paddingTop: 56 }}>
      <Text style={s.title}>{editando ? 'Editar movimiento' : 'Movimiento de caja'}</Text>

      <Text style={s.label}>Tipo</Text>
      <View style={s.chips}>
        {OPCIONES.map((o) => (
          <TouchableOpacity key={o.label} style={[s.chip, sel.label === o.label && s.chipSel]} onPress={() => setSel(o)}>
            <Text style={[s.chipText, sel.label === o.label && s.chipTextSel]}>{o.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>Monto</Text>
      <TextInput style={s.input} value={monto} onChangeText={setMonto} placeholder="0" placeholderTextColor="#bbb" keyboardType="numeric" />
      <Text style={s.label}>Descripción</Text>
      <TextInput style={s.input} value={descripcion} onChangeText={setDescripcion} placeholder="Opcional" placeholderTextColor="#bbb" />

      <TouchableOpacity style={s.btn} onPress={guardar} disabled={mut.isPending}>
        {mut.isPending ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Registrar</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.back()}><Text style={s.cancel}>Cancelar</Text></TouchableOpacity>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.primary, marginBottom: 12 },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, fontSize: 15, color: COLORS.text, borderWidth: 1.5, borderColor: COLORS.border },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  chipSel: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 13, color: COLORS.text, fontWeight: '600' },
  chipTextSel: { color: '#fff' },
  btn: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 28 },
  btnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  cancel: { textAlign: 'center', color: COLORS.textLight, marginTop: 16, fontSize: 14 },
})
