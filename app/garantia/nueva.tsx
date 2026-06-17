import { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Image } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import * as ImagePicker from 'expo-image-picker'
import { crearGarantia, editarGarantia, getGarantias } from '@/api/garantias'
import { subirFotoGarantia, firmarUrl, firmarUrls } from '@/lib/upload'
import { queryClient } from '@/lib/queryClient'
import { COLORS } from '@/lib/constants'

const TIPOS = ['tarjeta_bancaria', 'cedula', 'titulo_vehiculo', 'propiedad', 'joyas', 'otro'] as const

export default function NuevaGarantia() {
  const router = useRouter()
  const { prestamoId, id } = useLocalSearchParams<{ prestamoId: string; id?: string }>()
  const editando = !!id
  const [tipo, setTipo] = useState<(typeof TIPOS)[number]>('cedula')
  const [descripcion, setDescripcion] = useState('')
  const [fotos, setFotos] = useState<string[]>([]) // rutas en el bucket
  const [previews, setPreviews] = useState<string[]>([]) // URLs firmadas para mostrar
  const [subiendo, setSubiendo] = useState(false)

  const existentes = useQuery({ queryKey: ['garantias', prestamoId], queryFn: () => getGarantias(prestamoId), enabled: editando })
  useEffect(() => {
    const g = existentes.data?.find((x) => x.id === id)
    if (g) {
      setTipo((TIPOS as readonly string[]).includes(g.tipo) ? (g.tipo as (typeof TIPOS)[number]) : 'otro')
      setDescripcion(g.descripcion ?? '')
      const paths = g.foto_urls ?? []
      setFotos(paths)
      firmarUrls(paths).then(setPreviews)
    }
  }, [existentes.data])

  async function agregarFoto() {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6 })
    if (r.canceled || !r.assets?.[0]) return
    setSubiendo(true)
    try {
      const path = await subirFotoGarantia(r.assets[0].uri)
      const signed = await firmarUrl(path)
      setFotos((prev) => [...prev, path])
      setPreviews((prev) => [...prev, signed ?? ''])
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo subir la foto')
    } finally {
      setSubiendo(false)
    }
  }

  const mut = useMutation({
    mutationFn: () => {
      const payload = { tipo, descripcion: descripcion.trim() || null, foto_urls: fotos.length ? fotos : null }
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
    onError: (e: any) => Alert.alert('Error', e.message ?? 'No se pudo guardar'),
  })

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 20, paddingTop: 56 }}>
      <Text style={s.title}>{editando ? 'Editar garantía' : 'Nueva garantía'}</Text>

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

      <Text style={s.label}>Fotos</Text>
      <View style={s.fotos}>
        {previews.filter(Boolean).map((url) => (
          <Image key={url} source={{ uri: url }} style={s.foto} />
        ))}
        <TouchableOpacity style={s.addFoto} onPress={agregarFoto} disabled={subiendo}>
          {subiendo ? <ActivityIndicator color={COLORS.primary} /> : <Text style={s.addFotoText}>＋</Text>}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={s.btn} onPress={() => mut.mutate()} disabled={mut.isPending || subiendo}>
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
  fotos: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  foto: { width: 72, height: 72, borderRadius: 10, backgroundColor: COLORS.surface },
  addFoto: { width: 72, height: 72, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surface },
  addFotoText: { fontSize: 30, color: COLORS.textLight },
  btn: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 28 },
  btnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  cancel: { textAlign: 'center', color: COLORS.textLight, marginTop: 16, fontSize: 14 },
})
