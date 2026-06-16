import { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { useMutation, useQuery } from '@tanstack/react-query'
import { crearCliente, editarCliente, getCliente } from '@/api/clientes'
import { queryClient } from '@/lib/queryClient'
import { useSession } from '@/store/session'
import { COLORS } from '@/lib/constants'

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
    mutationFn: () => {
      const patch = {
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        cedula: cedula.trim() || null,
        direccion: direccion.trim() || null,
      }
      return editando
        ? editarCliente(id!, patch)
        : crearCliente({ cartera_id: carteraId!, ...patch }).then(() => {})
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes', carteraId] })
      if (editando) queryClient.invalidateQueries({ queryKey: ['cliente', id] })
      router.back()
    },
    onError: (e: any) => Alert.alert('Error', e.message ?? 'No se pudo guardar el cliente'),
  })

  function guardar() {
    if (!nombre.trim()) return Alert.alert('Falta el nombre')
    if (!telefono.trim()) return Alert.alert('Falta el teléfono')
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

      <TouchableOpacity style={s.btn} onPress={guardar} disabled={mut.isPending}>
        {mut.isPending ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Guardar cliente</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.back()}><Text style={s.cancel}>Cancelar</Text></TouchableOpacity>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.primary, marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, fontSize: 15, color: COLORS.text, borderWidth: 1.5, borderColor: COLORS.border },
  btn: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 28 },
  btnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  cancel: { textAlign: 'center', color: COLORS.textLight, marginTop: 16, fontSize: 14 },
})
