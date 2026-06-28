import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import {
  tienePinLocal,
  guardarPinLocal,
  verificarPinLocal,
  limpiarPinLocal,
  biometriaDisponible,
  biometriaActiva,
  autenticarBiometria,
  pinBloqueadoMs,
  registrarFalloPin,
} from '@/lib/pin'
import { signOut, signIn, getUsuarioActual } from '@/api/auth'
import { errMsg } from '@/lib/errores'
import { queryClient } from '@/lib/queryClient'
import { useSession } from '@/store/session'
import { color, font, gradient } from '@/theme'

export default function Lock() {
  const router = useRouter()
  const { setDesbloqueado, reset } = useSession()
  const [modo, setModo] = useState<'verificar' | 'crear' | 'reauth' | null>(null)
  const [pin, setPin] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [paso, setPaso] = useState<'ingresar' | 'confirmar'>('ingresar')
  const [bloqueoSeg, setBloqueoSeg] = useState(0)
  const [password, setPassword] = useState('')
  const [reauthLoading, setReauthLoading] = useState(false)

  function desbloquear() {
    setDesbloqueado(true)
    router.replace('/(app)/dashboard')
  }

  useEffect(() => {
    ;(async () => {
      const tiene = await tienePinLocal()
      setModo(tiene ? 'verificar' : 'crear')
      const ms = await pinBloqueadoMs()
      if (ms > 0) setBloqueoSeg(Math.ceil(ms / 1000))
      if (tiene && ms === 0 && (await biometriaActiva()) && (await biometriaDisponible())) {
        if (await autenticarBiometria()) desbloquear()
      }
    })()
  }, [])

  // Cuenta regresiva del bloqueo por intentos fallidos.
  useEffect(() => {
    if (bloqueoSeg <= 0) return
    const t = setInterval(() => setBloqueoSeg((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [bloqueoSeg])

  async function onNumero(n: string) {
    if (modo === 'verificar') {
      if (bloqueoSeg > 0) return
      const nuevo = pin + n
      if (nuevo.length > 4) return
      setPin(nuevo)
      if (nuevo.length === 4) {
        if (await verificarPinLocal(nuevo)) desbloquear()
        else {
          setPin('')
          const r = await registrarFalloPin()
          if (r.bloqueado) {
            const ms = await pinBloqueadoMs()
            setBloqueoSeg(Math.ceil(ms / 1000))
            Alert.alert('Demasiados intentos', 'Espera 5 minutos o usa "Olvidé mi PIN".')
          } else {
            Alert.alert('PIN incorrecto', `Te quedan ${r.restantes} intento(s).`)
          }
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

  // "Olvidé mi PIN" ya no es un reseteo libre: exige la contraseña de la cuenta.
  // Así, quien tenga el teléfono robado no puede saltarse el PIN.
  function olvidePin() {
    setPassword('')
    setModo('reauth')
  }

  async function confirmarReauth() {
    if (!password.trim()) return Alert.alert('Escribe tu contraseña')
    setReauthLoading(true)
    try {
      const user = await getUsuarioActual()
      if (!user?.email) {
        Alert.alert('Sesión no disponible', 'Inicia sesión de nuevo.')
        await cerrarSesion()
        return
      }
      await signIn(user.email, password) // lanza si la contraseña es incorrecta
      await limpiarPinLocal()
      setPin('')
      setConfirmar('')
      setPassword('')
      setPaso('ingresar')
      setModo('crear')
    } catch (e: any) {
      Alert.alert('Contraseña incorrecta', errMsg(e, 'No pudimos verificar tu identidad.'))
    } finally {
      setReauthLoading(false)
    }
  }

  async function cerrarSesion() {
    await signOut().catch(() => {})
    await limpiarPinLocal()
    reset()
    queryClient.clear()
    router.replace('/(auth)/login')
  }

  // Pantalla de reautenticación (para restablecer el PIN con la contraseña de la cuenta).
  if (modo === 'reauth') {
    return (
      <LinearGradient colors={gradient.hero} style={{ flex: 1 }}>
        <View style={s.container}>
          <Text style={s.title}>Verifica tu identidad</Text>
          <Text style={s.sub}>Escribe la contraseña de tu cuenta para crear un PIN nuevo.</Text>
          <TextInput
            style={s.pwd}
            value={password}
            onChangeText={setPassword}
            placeholder="Contraseña"
            placeholderTextColor="rgba(255,255,255,0.5)"
            secureTextEntry
            autoCapitalize="none"
          />
          <TouchableOpacity style={s.pwdBtn} onPress={confirmarReauth} disabled={reauthLoading} activeOpacity={0.9}>
            {reauthLoading ? <ActivityIndicator color={color.primary} /> : <Text style={s.pwdBtnText}>Continuar</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setModo('verificar'); setPassword('') }} style={{ marginTop: 20 }}>
            <Text style={s.olvide}>Volver</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    )
  }

  const teclado = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']
  const bloqueado = modo === 'verificar' && bloqueoSeg > 0
  const sub = bloqueado
    ? `Bloqueado. Intenta en ${Math.floor(bloqueoSeg / 60)}:${String(bloqueoSeg % 60).padStart(2, '0')}`
    : modo === 'crear'
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
      <View style={[s.grid, bloqueado && { opacity: 0.4 }]}>
        {teclado.map((n, i) => (
          <TouchableOpacity
            key={i}
            style={[s.key, !n && s.keyHidden]}
            disabled={!n || bloqueado}
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
  pwd: { width: '100%', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 15, fontFamily: font.body, fontSize: 15, color: '#fff', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.22)', marginTop: 24 },
  pwdBtn: { width: '100%', backgroundColor: '#fff', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 16 },
  pwdBtnText: { fontFamily: font.bodyBold, fontSize: 15, color: color.primary },
})
