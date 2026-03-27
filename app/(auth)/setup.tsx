import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { guardarCarteraActiva } from '../../lib/storage'
import { COLORS } from '../../constants'

const MONEDAS = ['RD$', 'USD', 'COP', 'MXN', 'EUR', 'S/']
const COLORES = ['#1a1a2e', '#2e7d32', '#1565c0', '#c62828', '#e65100', '#4527a0']

export default function Setup() {
  const router = useRouter()
  const [nombre, setNombre] = useState('')
  const [cartera, setCartera] = useState('Mi Cartera')
  const [moneda, setMoneda] = useState('RD$')
  const [color, setColor] = useState('#1a1a2e')
  const [loading, setLoading] = useState(false)

  async function crear() {
    if (!nombre.trim()) { Alert.alert('Falta tu nombre'); return }
    if (!cartera.trim()) { Alert.alert('Falta el nombre de la cartera'); return }
    setLoading(true)
    try {
      // Crear prestamista
      const { data: p, error: pe } = await supabase
        .from('prestamistas')
        .insert({ nombre: nombre.trim(), moneda })
        .select().single()
      if (pe) throw pe

      // Crear cartera
      const { data: c, error: ce } = await supabase
        .from('carteras')
        .insert({ prestamista_id: p.id, nombre: cartera.trim(), color, moneda, activa: true })
        .select().single()
      if (ce) throw ce

      await guardarCarteraActiva(c.id)
      router.replace('/(app)/dashboard')
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo crear la cartera')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 28, paddingTop: 60 }}>
      <Text style={s.emoji}>💰</Text>
      <Text style={s.title}>Bienvenido a Préstalo</Text>
      <Text style={s.sub}>Configura tu perfil para empezar</Text>

      <Text style={s.label}>Tu nombre</Text>
      <TextInput style={s.input} value={nombre} onChangeText={setNombre} placeholder="Ej: Juan Perez" placeholderTextColor="#bbb" />

      <Text style={s.label}>Nombre de tu cartera</Text>
      <TextInput style={s.input} value={cartera} onChangeText={setCartera} placeholder="Ej: Mi Cartera Principal" placeholderTextColor="#bbb" />

      <Text style={s.label}>Moneda</Text>
      <View style={s.opts}>
        {MONEDAS.map(m => (
          <TouchableOpacity key={m} style={[s.opt, moneda === m && s.optSel]} onPress={() => setMoneda(m)}>
            <Text style={[s.optText, moneda === m && s.optTextSel]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>Color de la cartera</Text>
      <View style={s.opts}>
        {COLORES.map(c => (
          <TouchableOpacity key={c} style={[s.colorDot, { backgroundColor: c }, color === c && s.colorSel]} onPress={() => setColor(c)} />
        ))}
      </View>

      <TouchableOpacity style={s.btn} onPress={crear} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Crear mi cartera</Text>}
      </TouchableOpacity>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  emoji: { fontSize: 56, textAlign: 'center', marginBottom: 12 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.gold, textAlign: 'center', marginBottom: 6 },
  sub: { fontSize: 14, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginBottom: 36 },
  label: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 14, fontSize: 15, color: '#fff', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)' },
  opts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opt: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)' },
  optSel: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  optText: { fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  optTextSel: { color: COLORS.primary },
  colorDot: { width: 40, height: 40, borderRadius: 20 },
  colorSel: { borderWidth: 3, borderColor: COLORS.gold },
  btn: { backgroundColor: COLORS.gold, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 36 },
  btnText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
})
