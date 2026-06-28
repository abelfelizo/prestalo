import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { errMsg } from '@/lib/errores'
import { useRouter } from 'expo-router'
import { useMutation } from '@tanstack/react-query'
import { crearHeredero } from '@/api/herederos'
import { hashPin } from '@/lib/pin'
import { telefonoValido } from '@/lib/validar'
import { queryClient } from '@/lib/queryClient'
import { Boton } from '@/components/Boton'
import { useSession } from '@/store/session'
import { exigirSuscripcion } from '@/lib/guard'
import { color as COLORS, font, radius, shadowCard } from '@/theme'

const RELACIONES = ['familiar', 'socio', 'amigo', 'abogado'] as const

export default function NuevoHeredero() {
  const router = useRouter()
  const prestamistaId = useSession((s) => s.prestamistaId)
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [relacion, setRelacion] = useState<(typeof RELACIONES)[number]>('familiar')
  const [clave, setClave] = useState('')
  const [dias, setDias] = useState('30')

  const mut = useMutation({
    mutationFn: async () =>
      crearHeredero({
        prestamista_id: prestamistaId!,
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        relacion,
        clave_hash: await hashPin(clave),
        dias_inactividad: parseInt(dias, 10) || 30,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['herederos', prestamistaId] })
      router.back()
    },
    onError: (e: any) => Alert.alert('Error', errMsg(e, 'No se pudo guardar')),
  })

  function guardar() {
    if (!exigirSuscripcion(router)) return
    if (!nombre.trim()) return Alert.alert('Falta el nombre')
    if (!telefonoValido(telefono)) return Alert.alert('Teléfono inválido', 'Debe tener entre 7 y 15 dígitos.')
    if (clave.length < 6) return Alert.alert('Clave muy corta', 'Mínimo 6 caracteres')
    mut.mutate()
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 20, paddingTop: 56 }}>
      <Text style={s.title}>Nuevo heredero</Text>
      <Text style={s.sub}>Si dejas de usar la app por los días indicados, esta persona podrá acceder a la información con su clave.</Text>

      <Text style={s.label}>Nombre *</Text>
      <TextInput style={s.input} value={nombre} onChangeText={setNombre} placeholder="Nombre" placeholderTextColor="#bbb" />
      <Text style={s.label}>Teléfono *</Text>
      <TextInput style={s.input} value={telefono} onChangeText={setTelefono} placeholder="809..." placeholderTextColor="#bbb" keyboardType="phone-pad" />

      <Text style={s.label}>Relación</Text>
      <View style={s.chips}>
        {RELACIONES.map((r) => (
          <TouchableOpacity key={r} style={[s.chip, relacion === r && s.chipSel]} onPress={() => setRelacion(r)}>
            <Text style={[s.chipText, relacion === r && s.chipTextSel]}>{r}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>Clave de acceso *</Text>
      <TextInput style={s.input} value={clave} onChangeText={setClave} placeholder="Clave para el heredero" placeholderTextColor="#bbb" secureTextEntry />
      <Text style={s.label}>Días de inactividad para activar</Text>
      <TextInput style={s.input} value={dias} onChangeText={setDias} placeholder="30" placeholderTextColor="#bbb" keyboardType="numeric" />

      <Boton icon="check" label="Guardar heredero" loading={mut.isPending} onPress={guardar} style={{ marginTop: 28 }} />
      <TouchableOpacity onPress={() => router.back()}><Text style={s.cancel}>Cancelar</Text></TouchableOpacity>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  title: { fontFamily: font.display, fontSize: 24, color: COLORS.ink, letterSpacing: -0.6 },
  sub: { fontFamily: font.body, fontSize: 13, color: COLORS.muted, marginTop: 6, marginBottom: 6, lineHeight: 19 },
  label: { fontFamily: font.bodyBold, fontSize: 11, color: COLORS.faint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: COLORS.surface, borderRadius: radius.md, padding: 14, fontFamily: font.body, fontSize: 15, color: COLORS.ink, ...shadowCard },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.md, backgroundColor: COLORS.surface, ...shadowCard },
  chipSel: { backgroundColor: COLORS.primary },
  chipText: { fontFamily: font.bodySemi, fontSize: 13, color: COLORS.ink },
  chipTextSel: { color: '#fff' },
  cancel: { fontFamily: font.bodySemi, textAlign: 'center', color: COLORS.muted, marginTop: 16, fontSize: 14 },
})
