import { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { errMsg } from '@/lib/errores'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { editarMovimiento, getMovimiento } from '@/api/caja'
import { ejecutar } from '@/lib/outbox'
import { nuevoOpId } from '@/lib/opid'
import { hoyLocalISO } from '@/lib/calculos'
import { exigirSuscripcion } from '@/lib/guard'
import { Boton } from '@/components/Boton'
import { queryClient } from '@/lib/queryClient'
import { useSession } from '@/store/session'
import { color as COLORS, font, radius, shadowCard } from '@/theme'

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
        fecha: hoyLocalISO(),
      }
      return editando
        ? editarMovimiento(id!, payload).then(() => ({ encolado: false }))
        : ejecutar('crearMovimiento', { ...payload, client_op_id: nuevoOpId() })
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['caja', carteraId] })
      queryClient.invalidateQueries({ queryKey: ['caja-balance', carteraId] })
      if (res?.encolado) Alert.alert('Sin conexión', 'El movimiento se guardó y se enviará al recuperar internet.')
      router.back()
    },
    onError: (e: any) => Alert.alert('Error', errMsg(e, 'No se pudo registrar')),
  })

  function guardar() {
    if (!exigirSuscripcion(router)) return
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

      <Boton icon="check" label={editando ? 'Guardar' : 'Registrar'} loading={mut.isPending} onPress={guardar} style={{ marginTop: 28 }} />
      <TouchableOpacity onPress={() => router.back()}><Text style={s.cancel}>Cancelar</Text></TouchableOpacity>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  title: { fontFamily: font.display, fontSize: 24, color: COLORS.ink, letterSpacing: -0.6, marginBottom: 12 },
  label: { fontFamily: font.bodyBold, fontSize: 11, color: COLORS.faint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: COLORS.surface, borderRadius: radius.md, padding: 14, fontFamily: font.body, fontSize: 15, color: COLORS.ink, ...shadowCard },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.md, backgroundColor: COLORS.surface, ...shadowCard },
  chipSel: { backgroundColor: COLORS.primary },
  chipText: { fontFamily: font.bodySemi, fontSize: 13, color: COLORS.ink },
  chipTextSel: { color: '#fff' },
  cancel: { fontFamily: font.bodySemi, textAlign: 'center', color: COLORS.muted, marginTop: 16, fontSize: 14 },
})
