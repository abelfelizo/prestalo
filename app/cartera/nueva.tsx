import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useMutation } from '@tanstack/react-query'
import { crearCartera, setCarteraActiva } from '@/api/prestamistas'
import { queryClient } from '@/lib/queryClient'
import { Boton } from '@/components/Boton'
import { useSession } from '@/store/session'
import { COLORS, COLOR_CARTERA, MONEDAS } from '@/lib/constants'
import type { ColorCartera } from '@/types'

const COLORES = Object.keys(COLOR_CARTERA) as ColorCartera[]

export default function NuevaCartera() {
  const router = useRouter()
  const { prestamistaId, setCarteraActiva: setActivaLocal, setMoneda } = useSession()
  const [nombre, setNombre] = useState('')
  const [moneda, setMonedaLocal] = useState('RD$')
  const [color, setColor] = useState<ColorCartera>('blue')
  const [capital, setCapital] = useState('')
  const [activar, setActivar] = useState(true)

  const mut = useMutation({
    mutationFn: async () => {
      const cartera = await crearCartera({
        prestamista_id: prestamistaId!,
        nombre: nombre.trim(),
        moneda,
        color,
        capital_inicial: parseFloat(capital) || 0,
        activa: true,
      })
      if (activar) {
        await setCarteraActiva(prestamistaId!, cartera.id)
      }
      return cartera
    },
    onSuccess: (cartera) => {
      queryClient.invalidateQueries({ queryKey: ['carteras', prestamistaId] })
      if (activar) {
        setActivaLocal(cartera.id)
        setMoneda(cartera.moneda)
        queryClient.invalidateQueries()
      }
      router.back()
    },
    onError: (e: any) => Alert.alert('Error', e.message ?? 'No se pudo crear la cartera'),
  })

  function guardar() {
    if (!nombre.trim()) return Alert.alert('Falta el nombre')
    mut.mutate()
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 20, paddingTop: 56 }}>
      <Text style={s.title}>Nueva cartera</Text>

      <Text style={s.label}>Nombre *</Text>
      <TextInput style={s.input} value={nombre} onChangeText={setNombre} placeholder="Ej: Cartera Norte" placeholderTextColor="#bbb" />

      <Text style={s.label}>Capital inicial</Text>
      <TextInput style={s.input} value={capital} onChangeText={setCapital} placeholder="0" placeholderTextColor="#bbb" keyboardType="numeric" />

      <Text style={s.label}>Moneda</Text>
      <View style={s.opts}>
        {MONEDAS.map((m) => (
          <TouchableOpacity key={m} style={[s.opt, moneda === m && s.optSel]} onPress={() => setMonedaLocal(m)}>
            <Text style={[s.optText, moneda === m && s.optTextSel]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>Color</Text>
      <View style={s.opts}>
        {COLORES.map((c) => (
          <TouchableOpacity key={c} style={[s.dot, { backgroundColor: COLOR_CARTERA[c] }, color === c && s.dotSel]} onPress={() => setColor(c)} />
        ))}
      </View>

      <TouchableOpacity style={[s.opt, activar && s.optSel, { marginTop: 16, alignSelf: 'flex-start' }]} onPress={() => setActivar(!activar)}>
        <Text style={[s.optText, activar && s.optTextSel]}>{activar ? '✓ ' : ''}Activar al crear</Text>
      </TouchableOpacity>

      <Boton icon="check" label="Crear cartera" loading={mut.isPending} onPress={guardar} style={{ marginTop: 28 }} />
      <TouchableOpacity onPress={() => router.back()}><Text style={s.cancel}>Cancelar</Text></TouchableOpacity>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.primary, marginBottom: 8 },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, fontSize: 15, color: COLORS.text, borderWidth: 1.5, borderColor: COLORS.border },
  opts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opt: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  optSel: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  optText: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  optTextSel: { color: '#fff' },
  dot: { width: 40, height: 40, borderRadius: 20 },
  dotSel: { borderWidth: 3, borderColor: COLORS.primary },
  btn: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 28 },
  btnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  cancel: { textAlign: 'center', color: COLORS.textLight, marginTop: 16, fontSize: 14 },
})
