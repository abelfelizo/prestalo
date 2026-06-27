import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import {
  tienePinLocal,
  guardarPinLocal,
  verificarPinLocal,
  limpiarPinLocal,
  biometriaDisponible,
  autenticarBiometria,
} from '@/lib/pin'
import { signOut } from '@/api/auth'
import { queryClient } from '@/lib/queryClient'
import { useSession } from '@/store/session'
import { font, gradient } from '@/theme'

export default function Lock() {
  const router = useRouter()
  const { setDesbloqueado, reset } = useSession()
  const [modo, setModo] = useState<'verificar' | 'crear' | null>(null)
  const [pin, setPin] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [paso, setPaso] = useState<'ingresar' | 'confirmar'>('ingresar')

  function desbloquear() {
    setDesbloqueado(true)
    router.replace('/(app)/dashboard')
  }

  useEffect(() => {
    ;(async () => {
      const tiene = await tienePinLocal()
      setModo(tiene ? 'verificar' : 'crear')
      if (tiene && (await biometriaDisponible())) {
        if (await autenticarBiometria()) desbloquear()
      }
    })()
  }, [])

  async function onNumero(n: string) {
    if (modo === 'verificar') {
      const nuevo = pin + n
      if (nuevo.length > 4) return
      setPin(nuevo)
      if (nuevo.length === 4) {
        if (await verificarPinLocal(nuevo)) desbloquear()
        else {
          setPin('')
          Alert.alert('PIN incorrecto', 'Intenta de nuevo')
        }
      }
      return
    }
    // modo crear
    if (paso === 'ingresar') {
      const nuevo = pin + n
      if (nuevo.length > 4) return
      setPin(nuevo)
      if (nuevo.length === 4) {
        setConfirmar(nuevo)
        setPin('')
        setPaso('confirmar')
      }
    } else {
      const nuevo = pin + n
      if (nuevo.length > 4) return
      setPin(nuevo)
      if (nuevo.length === 4) {
        if (nuevo === confirmar) {
          await guardarPinLocal(nuevo)
          desbloquear()
        } else {
          setPin('')
          setConfirmar('')
          setPaso('ingresar')
          Alert.alert('No coinciden', 'Los PIN no coinciden. Intenta de nuevo.')
        }
      }
    }
  }

  async function olvidePin() {
    Alert.alert('Restablecer PIN', 'Crearás un PIN nuevo. ¿Continuar?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sí',
        onPress: async () => {
          await limpiarPinLocal()
          setPin('')
          setConfirmar('')
          setPaso('ingresar')
          setModo('crear')
        },
      },
    ])
  }

  async function cerrarSesion() {
    await signOut().catch(() => {})
    await limpiarPinLocal()
    reset()
    queryClient.clear()
    router.replace('/(auth)/login')
  }

  const teclado = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']
  const sub =
    modo === 'crear'
      ? paso === 'ingresar'
        ? 'Crea un PIN de 4 dígitos'
        : 'Confirma tu PIN'
      : 'Ingresa tu PIN'

  return (
    <LinearGradient colors={gradient.hero} style={{ flex: 1 }}>
    <View style={s.container}>
      <Text style={s.title}>Kuotas</Text>
      <Text style={s.sub}>{sub}</Text>
      <View style={s.dots}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[s.dot, pin.length > i && s.dotActive]} />
        ))}
      </View>
      <View style={s.grid}>
        {teclado.map((n, i) => (
          <TouchableOpacity
            key={i}
            style={[s.key, !n && s.keyHidden]}
            disabled={!n}
            onPress={() => {
              if (!n) return
              if (n === '⌫') setPin((p) => p.slice(0, -1))
              else onNumero(n)
            }}
          >
            <Text style={s.keyText}>{n}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {modo === 'verificar' && (
        <TouchableOpacity onPress={olvidePin} style={{ marginTop: 28 }}>
          <Text style={s.olvide}>Olvidé mi PIN</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={cerrarSesion} style={{ marginTop: 16 }}>
        <Text style={s.olvide}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
    </LinearGradient>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { fontFamily: font.display, fontSize: 34, color: '#FFFFFF', marginBottom: 8, letterSpacing: -1 },
  sub: { fontFamily: font.body, fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 40 },
  dots: { flexDirection: 'row', gap: 16, marginBottom: 52 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)' },
  dotActive: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: 288, gap: 12, justifyContent: 'center' },
  key: { width: 84, height: 84, borderRadius: 42, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  keyHidden: { backgroundColor: 'transparent' },
  keyText: { fontFamily: font.displaySemi, fontSize: 26, color: '#fff' },
  olvide: { fontFamily: font.bodySemi, color: 'rgba(255,255,255,0.7)', fontSize: 14 },
})
