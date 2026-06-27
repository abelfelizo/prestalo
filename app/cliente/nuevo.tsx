import { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { editarCliente, getCliente } from '@/api/clientes'
import { ejecutar } from '@/lib/outbox'
import { Boton } from '@/components/Boton'
import { telefonoValido } from '@/lib/validar'
import { queryClient } from '@/lib/queryClient'
import { useSession } from '@/store/session'
import { color as COLORS, font, radius, shadowCard } from '@/theme'

export default function NuevoCliente() {
  const router = useRouter()
  const carteraId = useSession((s) => s.carteraActivaId)
  const { id } = useLocalSearchParams<{ id?: string }>()
  const editando = !!id

  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [cedula, setCedula] = useState('')
  const [direccion, setDireccion] = useState('')

  const existente = useQuery({ queryKey: ['cliente', id], queryFn: () => getCliente(id!), enabled: editando })
  useEffect(() => {
    const c = existente.data
    if (c) {
      setNombre(c.nombre)
      setTelefono(c.telefono)
      setCedula(c.cedula ?? '')
      setDireccion(c.direccion ?? '')
    }
  }, [existente.data])

  const mut = useMutation({
    mutationFn: async () => {
      const patch = {
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        cedula: cedula.trim() || null,
        direccion: direccion.trim() || null,
      }
      if (editando) {
        await editarCliente(id!, patch)
        return { encolado: false }
      }
      return ejecutar('crearCliente', { cartera_id: carteraId!, ...patch })
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['clientes', carteraId] })
      if (editando) queryClient.invalidateQueries({ queryKey: ['cliente', id] })
      if (res?.encolado) Alert.alert('Sin conexión', 'El cliente se guardó y se enviará al recuperar internet.')
      router.back()
    },
    onError: (e: any) => Alert.alert('Error', e.message ?? 'No se pudo guardar el cliente'),
  })

  function guardar() {
    if (!nombre.trim()) return Alert.alert('Falta el nombre')
    if (!telefonoValido(telefono)) return Alert.alert('Teléfono inválido', 'Debe tener entre 7 y 15 dígitos.')
    mut.mutate()
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 20, paddingTop: 56 }}>
      <Text style={s.title}>{editando ? 'Editar cliente' : 'Nuevo cliente'}</Text>

      <Text style={s.label}>Nombre *</Text>
      <TextInput style={s.input} value={nombre} onChangeText={setNombre} placeholder="Nombre completo" placeholderTextColor="#bbb" />
      <Text style={s.label}>Teléfono *</Text>
      <TextInput style={s.input} value={telefono} onChangeText={setTelefono} placeholder="809..." placeholderTextColor="#bbb" keyboardType="phone-pad" />
      <Text style={s.label}>Cédula</Text>
      <TextInput style={s.input} value={cedula} onChangeText={setCedula} placeholder="Opcional" placeholderTextColor="#bbb" />
      <Text style={s.label}>Dirección</Text>
      <TextInput style={s.input} value={direccion} onChangeText={setDireccion} placeholder="Opcional" placeholderTextColor="#bbb" />

      <Boton icon="check" label={editando ? 'Guardar cambios' : 'Guardar cliente'} loading={mut.isPending} onPress={guardar} style={{ marginTop: 28 }} />
      <TouchableOpacity onPress={() => router.back()}><Text style={s.cancel}>Cancelar</Text></TouchableOpacity>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  title: { fontFamily: font.display, fontSize: 24, color: COLORS.ink, letterSpacing: -0.6, marginBottom: 16 },
  label: { fontFamily: font.bodyBold, fontSize: 11, color: COLORS.faint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: COLORS.surface, borderRadius: radius.md, padding: 14, fontFamily: font.body, fontSize: 15, color: COLORS.ink, ...shadowCard },
  cancel: { fontFamily: font.bodySemi, textAlign: 'center', color: COLORS.muted, marginTop: 16, fontSize: 14 },
})
