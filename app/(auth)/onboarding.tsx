import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { getUsuarioActual } from '@/api/auth'
import { completarOnboarding } from '@/api/onboarding'
import { guardarPinLocal, hashPin } from '@/lib/pin'
import { useSession } from '@/store/session'
import { COLOR_CARTERA, MONEDAS } from '@/lib/constants'
import { color, font, gradient, radius } from '@/theme'
import type { ColorCartera } from '@/types'

const COLORES = Object.keys(COLOR_CARTERA) as ColorCartera[]

export default function Onboarding() {
  const router = useRouter()
  const { setPrestamista, setCarteraActiva, setMoneda: setMonedaSesion, setDesbloqueado } = useSession()

  const [fase, setFase] = useState<'perfil' | 'pin'>('perfil')
  const [nombre, setNombre] = useState('')
  const [cartera, setCartera] = useState('Mi Cartera')
  const [moneda, setMoneda] = useState('RD$')
  const [colorSel, setColorSel] = useState<ColorCartera>('green')
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
        color: colorSel,
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
      <LinearGradient colors={gradient.hero} style={{ flex: 1 }}>
        <View style={s.pinBox}>
          <Text style={s.eyebrow}>PASO 2 DE 2</Text>
          <Text style={s.title}>Crea tu PIN</Text>
          <Text style={s.sub}>4 dígitos para entrar rápido</Text>
          <TextInput style={s.pinInput} value={pin} onChangeText={(t) => setPin(t.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" secureTextEntry placeholder="••••" placeholderTextColor="rgba(255,255,255,0.4)" maxLength={4} />
          <TextInput style={s.pinInput} value={confirmar} onChangeText={(t) => setConfirmar(t.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" secureTextEntry placeholder="Confirmar" placeholderTextColor="rgba(255,255,255,0.4)" maxLength={4} />
          <TouchableOpacity style={s.btn} onPress={crear} disabled={loading} activeOpacity={0.9}>
            {loading ? <ActivityIndicator color={color.primary} /> : <Text style={s.btnText}>Finalizar</Text>}
          </TouchableOpacity>
        </View>
      </LinearGradient>
    )
  }

  return (
    <LinearGradient colors={gradient.hero} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 28, paddingTop: 64 }}>
        <View style={s.logo}><Text style={s.logoK}>K</Text></View>
        <Text style={s.eyebrow}>PASO 1 DE 2</Text>
        <Text style={s.title}>Bienvenido a Kuotas</Text>
        <Text style={s.sub}>Crea tu perfil y tu primera cartera</Text>

        <Text style={s.label}>Tu nombre</Text>
        <TextInput style={s.input} value={nombre} onChangeText={setNombre} placeholder="Ej: Juan Pérez" placeholderTextColor="rgba(255,255,255,0.4)" />

        <Text style={s.label}>Nombre de tu cartera</Text>
        <TextInput style={s.input} value={cartera} onChangeText={setCartera} placeholder="Ej: Cartera Principal" placeholderTextColor="rgba(255,255,255,0.4)" />

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
            <TouchableOpacity key={c} style={[s.dot, { backgroundColor: COLOR_CARTERA[c] }, colorSel === c && s.dotSel]} onPress={() => setColorSel(c)} />
          ))}
        </View>

        <TouchableOpacity style={s.btn} onPress={continuarPerfil} activeOpacity={0.9}>
          <Text style={s.btnText}>Continuar</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  )
}

const s = StyleSheet.create({
  logo: { width: 60, height: 60, borderRadius: radius.xl, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 18, alignSelf: 'flex-start' },
  logoK: { fontFamily: font.display, fontSize: 32, color: color.primary, lineHeight: 40 },
  eyebrow: { fontFamily: font.bodyBold, fontSize: 11, color: color.cyanLight, letterSpacing: 1.5 },
  title: { fontFamily: font.display, fontSize: 26, color: '#fff', marginTop: 6, marginBottom: 6, letterSpacing: -0.6 },
  sub: { fontFamily: font.body, fontSize: 14, color: 'rgba(255,255,255,0.72)', marginBottom: 24 },
  label: { fontFamily: font.bodyBold, fontSize: 11, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 14, fontFamily: font.body, fontSize: 15, color: '#fff', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.22)' },
  opts: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opt: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: radius.lg, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.22)' },
  optSel: { backgroundColor: '#fff', borderColor: '#fff' },
  optText: { fontFamily: font.bodySemi, fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  optTextSel: { color: color.primary },
  dot: { width: 38, height: 38, borderRadius: 19 },
  dotSel: { borderWidth: 3, borderColor: '#fff' },
  btn: { backgroundColor: '#fff', borderRadius: radius.lg, padding: 16, alignItems: 'center', marginTop: 30 },
  btnText: { fontFamily: font.bodyBold, fontSize: 15, color: color.primary },
  pinBox: { flex: 1, justifyContent: 'center', padding: 32 },
  pinInput: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radius.lg, padding: 16, fontFamily: font.displaySemi, fontSize: 22, color: '#fff', textAlign: 'center', letterSpacing: 8, marginBottom: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.22)' },
})
