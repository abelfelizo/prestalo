import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { getUsuarioActual } from '@/api/auth'
import { completarOnboarding } from '@/api/onboarding'
import { guardarPinLocal, hashPin } from '@/lib/pin'
import { useSession } from '@/store/session'
import { COLORS, COLOR_CARTERA, MONEDAS, GRADIENTS } from '@/lib/constants'
import type { ColorCartera } from '@/types'

const COLORES = Object.keys(COLOR_CARTERA) as ColorCartera[]

export default function Onboarding() {
  const router = useRouter()
  const { setPrestamista, setCarteraActiva, setMoneda: setMonedaSesion, setDesbloqueado } = useSession()

  const [fase, setFase] = useState<'perfil' | 'pin'>('perfil')
  const [nombre, setNombre] = useState('')
  const [cartera, setCartera] = useState('Mi Cartera')
  const [moneda, setMoneda] = useState('RD$')
  const [color, setColor] = useState<ColorCartera>('green')
  const [pin, setPin] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [loading, setLoading] = useState(false)

  function continuarPerfil() {
    if (!nombre.trim()) return Alert.alert('Falta tu nombre')
    if (!cartera.trim()) return Alert.alert('Falta el nombre de la cartera')
    setFase('pin')
  }

  async function crear() {
    if (pin.length !== 4) return Alert.alert('PIN inválido', 'El PIN debe tener 4 dígitos')
    if (pin !== confirmar) return Alert.alert('No coinciden', 'Los PIN no coinciden')
    setLoading(true)
    try {
      const user = await getUsuarioActual()
      if (!user) {
        router.replace('/(auth)/login')
        return
      }
      const pinHash = await hashPin(pin)
      const nuevaCartera = await completarOnboarding({
        userId: user.id,
        nombre: nombre.trim(),
        moneda,
        pinHash,
        metodoSeguridad: 'pin_4',
        nombreCartera: cartera.trim(),
        color,
      })
      await guardarPinLocal(pin)
      setPrestamista(user.id)
      setCarteraActiva(nuevaCartera.id)
      setMonedaSesion(nuevaCartera.moneda)
      setDesbloqueado(true)
      router.replace('/(app)/dashboard')
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo completar el registro')
    } finally {
      setLoading(false)
    }
  }

  if (fase === 'pin') {
    return (
      <LinearGradient colors={GRADIENTS.authBg} style={{ flex: 1 }}>
      <View style={s.container}>
        <View style={s.pinBox}>
          <Text style={s.title}>Crea tu PIN</Text>
          <Text style={s.sub}>4 dígitos para entrar rápido</Text>
          <TextInput style={s.pinInput} value={pin} onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" secureTextEntry placeholder="••••" placeholderTextColor="#555" maxLength={4} />
          <TextInput style={s.pinInput} value={confirmar} onChangeText={(t) => setConfirmar(t.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" secureTextEntry placeholder="Confirmar" placeholderTextColor="#555" maxLength={4} />
          <TouchableOpacity style={s.btn} onPress={crear} disabled={loading}>
            {loading ? <ActivityIndicator color={COLORS.primary} /> : <Text style={s.btnText}>Finalizar</Text>}
          </TouchableOpacity>
        </View>
      </View>
      </LinearGradient>
    )
  }

  return (
    <LinearGradient colors={GRADIENTS.authBg} style={{ flex: 1 }}>
    <ScrollView style={s.container} contentContainerStyle={{ padding: 28, paddingTop: 60 }}>
      <Text style={s.emoji}>💰</Text>
      <Text style={s.title}>Bienvenido a Préstalo</Text>
      <Text style={s.sub}>Configura tu perfil</Text>

      <Text style={s.label}>Tu nombre</Text>
      <TextInput style={s.input} value={nombre} onChangeText={setNombre} placeholder="Ej: Juan Pérez" placeholderTextColor="#bbb" />

      <Text style={s.label}>Nombre de tu cartera</Text>
      <TextInput style={s.input} value={cartera} onChangeText={setCartera} placeholder="Ej: Cartera Principal" placeholderTextColor="#bbb" />

      <Text style={s.label}>Moneda</Text>
      <View style={s.opts}>
        {MONEDAS.map((m) => (
          <TouchableOpacity key={m} style={[s.opt, moneda === m && s.optSel]} onPress={() => setMoneda(m)}>
            <Text style={[s.optText, moneda === m && s.optTextSel]}>{m}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={s.label}>Color de la cartera</Text>
      <View style={s.opts}>
        {COLORES.map((c) => (
          <TouchableOpacity key={c} style={[s.dot, { backgroundColor: COLOR_CARTERA[c] }, color === c && s.dotSel]} onPress={() => setColor(c)} />
        ))}
      </View>

      <TouchableOpacity style={s.btn} onPress={continuarPerfil}>
        <Text style={s.btnText}>Continuar</Text>
      </TouchableOpacity>
    </ScrollView>
    </LinearGradient>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  emoji: { fontSize: 52, textAlign: 'center', marginBottom: 10 },
  title: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', textAlign: 'center', marginBottom: 6 },
  sub: { fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 30 },
  label: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 14, fontSize: 15, color: '#fff', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)' },
  opts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opt: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)' },
  optSel: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  optText: { fontSize: 14, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  optTextSel: { color: COLORS.primary },
  dot: { width: 40, height: 40, borderRadius: 20 },
  dotSel: { borderWidth: 3, borderColor: '#fff' },
  btn: { backgroundColor: COLORS.gold, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 32 },
  btnText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  pinBox: { flex: 1, justifyContent: 'center', padding: 32 },
  pinInput: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, fontSize: 22, color: '#fff', textAlign: 'center', letterSpacing: 8, marginBottom: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)' },
})
