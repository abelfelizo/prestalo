import { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native'
import { errMsg } from '@/lib/errores'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { crearGarantia, editarGarantia, getGarantias } from '@/api/garantias'
import { Boton } from '@/components/Boton'
import { queryClient } from '@/lib/queryClient'
import { exigirSuscripcion } from '@/lib/guard'
import { color as COLORS, font, radius, shadowCard } from '@/theme'

const TIPOS = ['tarjeta_bancaria', 'cedula', 'titulo_vehiculo', 'propiedad', 'joyas', 'otro'] as const

export default function NuevaGarantia() {
  const router = useRouter()
  const { prestamoId, id } = useLocalSearchParams<{ prestamoId: string; id?: string }>()
  const editando = !!id
  const [tipo, setTipo] = useState<(typeof TIPOS)[number]>('cedula')
  const [descripcion, setDescripcion] = useState('')

  const existentes = useQuery({ queryKey: ['garantias', prestamoId], queryFn: () => getGarantias(prestamoId), enabled: editando })
  useEffect(() => {
    const g = existentes.data?.find((x) => x.id === id)
    if (g) {
      setTipo((TIPOS as readonly string[]).includes(g.tipo) ? (g.tipo as (typeof TIPOS)[number]) : 'otro')
      setDescripcion(g.descripcion ?? '')
    }
  }, [existentes.data])

  const mut = useMutation({
    mutationFn: () => {
      // Solo se registra el TIPO de garantía como constancia. No se guardan fotos
      // ni documentos para no almacenar datos sensibles (cédulas, tarjetas).
      const payload = { tipo, descripcion: descripcion.trim() || null, foto_urls: null }
      return editando
        ? editarGarantia(id!, payload)
        : crearGarantia({
            prestamo_id: prestamoId,
            estado: 'en_poder',
            fecha_recibida: new Date().toISOString().slice(0, 10),
            ...payload,
          }).then(() => {})
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garantias', prestamoId] })
      router.back()
    },
    onError: (e: any) => Alert.alert('Error', errMsg(e, 'No se pudo guardar')),
  })

  function guardar() {
    if (!exigirSuscripcion(router)) return
    mut.mutate()
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 20, paddingTop: 56 }}>
      <Text style={s.title}>{editando ? 'Editar garantía' : 'Nueva garantía'}</Text>
      <Text style={s.sub}>Registra qué garantía recibiste como constancia. No se suben fotos ni documentos.</Text>

      <Text style={s.label}>Tipo</Text>
      <View style={s.chips}>
        {TIPOS.map((t) => (
          <TouchableOpacity key={t} style={[s.chip, tipo === t && s.chipSel]} onPress={() => setTipo(t)}>
            <Text style={[s.chipText, tipo === t && s.chipTextSel]}>{t.replace(/_/g, ' ')}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>Descripción (opcional)</Text>
      <TextInput style={s.input} value={descripcion} onChangeText={setDescripcion} placeholder="Ej: tarjeta del Banco Popular, terminación 1234" placeholderTextColor="#bbb" />

      <Boton icon="check" label={editando ? 'Guardar cambios' : 'Guardar garantía'} loading={mut.isPending} onPress={guardar} style={{ marginTop: 28 }} />
      <TouchableOpacity onPress={() => router.back()}><Text style={s.cancel}>Cancelar</Text></TouchableOpacity>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  title: { fontFamily: font.display, fontSize: 24, color: COLORS.ink, letterSpacing: -0.6, marginBottom: 8 },
  sub: { fontFamily: font.body, fontSize: 13, color: COLORS.muted, marginBottom: 8, lineHeight: 19 },
  label: { fontFamily: font.bodyBold, fontSize: 11, color: COLORS.faint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: COLORS.surface, borderRadius: radius.md, padding: 14, fontFamily: font.body, fontSize: 15, color: COLORS.ink, ...shadowCard },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.md, backgroundColor: COLORS.surface, ...shadowCard },
  chipSel: { backgroundColor: COLORS.primary },
  chipText: { fontFamily: font.bodySemi, fontSize: 13, color: COLORS.ink },
  chipTextSel: { color: '#fff' },
  cancel: { fontFamily: font.bodySemi, textAlign: 'center', color: COLORS.muted, marginTop: 16, fontSize: 14 },
})
