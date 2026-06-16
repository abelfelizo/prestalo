import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useMutation } from '@tanstack/react-query'
import { crearGarantia } from '@/api/garantias'
import { queryClient } from '@/lib/queryClient'
import { COLORS } from '@/lib/constants'

const TIPOS = ['tarjeta_bancaria', 'cedula', 'titulo_vehiculo', 'propiedad', 'joyas', 'otro'] as const

export default function NuevaGarantia() {
  const router = useRouter()
  const { prestamoId } = useLocalSearchParams<{ prestamoId: string }>()
  const [tipo, setTipo] = useState<(typeof TIPOS)[number]>('cedula')
  const [descripcion, setDescripcion] = useState('')

  const mut = useMutation({
    mutationFn: () =>
      crearGarantia({
        prestamo_id: prestamoId,
        tipo,
        descripcion: descripcion.trim() || null,
        estado: 'en_poder',
        fecha_recibida: new Date().toISOString().slice(0, 10),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garantias', prestamoId] })
      router.back()
    },
    onError: (e: any) => Alert.alert('Error', e.message ?? 'No se pudo guardar'),
  })

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 20, paddingTop: 56 }}>
      <Text style={s.title}>Nueva garantía</Text>

      <Text style={s.label}>Tipo</Text>
      <View style={s.chips}>
        {TIPOS.map((t) => (
          <TouchableOpacity key={t} style={[s.chip, tipo === t && s.chipSel]} onPress={() => setTipo(t)}>
            <Text style={[s.chipText, tipo === t && s.chipTextSel]}>{t.replace(/_/g, ' ')}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>Descripción</Text>
      <TextInput style={s.input} value={descripcion} onChangeText={setDescripcion} placeholder="Detalle de la garantía" placeholderTextColor="#bbb" />

      <TouchableOpacity style={s.btn} onPress={() => mut.mutate()} disabled={mut.isPending}>
        {mut.isPending ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Guardar garantía</Text>}
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
