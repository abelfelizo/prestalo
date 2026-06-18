import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { signIn, signUp } from '@/api/auth'
import { emailValido } from '@/lib/validar'
import { COLORS, GRADIENTS } from '@/lib/constants'

export default function Login() {
  const router = useRouter()
  const [modo, setModo] = useState<'entrar' | 'crear'>('entrar')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!emailValido(email) || password.length < 6) {
      Alert.alert('Datos incompletos', 'Ingresa un email válido y una contraseña de al menos 6 caracteres.')
      return
    }
    setLoading(true)
    try {
      const { user, session } = modo === 'entrar'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password)

      // Si no hay sesión (p.ej. Supabase exige confirmar el correo), no avanzamos.
      if (!session || !user) {
        Alert.alert(
          'Confirma tu correo',
          'Te enviamos un email para confirmar tu cuenta. Ábrelo y luego inicia sesión aquí.',
        )
        setModo('entrar')
        setPassword('')
        return
      }
      // Deja que el arranque (index) cargue la sesión y decida lock/onboarding
      router.replace('/')
    } catch (e: any) {
      const msg: string = e?.message ?? 'No se pudo iniciar sesión'
      Alert.alert(
        'Error',
        /not confirmed/i.test(msg) ? 'Tu correo aún no está confirmado. Revisa tu email.' : msg,
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <LinearGradient colors={GRADIENTS.authBg} style={{ flex: 1 }}>
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={s.emoji}>💰</Text>
      <Text style={s.title}>Préstalo</Text>
      <Text style={s.sub}>{modo === 'entrar' ? 'Inicia sesión' : 'Crea tu cuenta'}</Text>

      <TextInput
        style={s.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor="#bbb"
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={s.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Contraseña"
        placeholderTextColor="#bbb"
        secureTextEntry
      />

      <TouchableOpacity style={s.btn} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color={COLORS.primary} /> : (
          <Text style={s.btnText}>{modo === 'entrar' ? 'Entrar' : 'Crear cuenta'}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setModo(modo === 'entrar' ? 'crear' : 'entrar')}>
        <Text style={s.toggle}>
          {modo === 'entrar' ? '¿No tienes cuenta? Crear una' : '¿Ya tienes cuenta? Inicia sesión'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.push('/heredero-acceso')}>
        <Text style={s.heredero}>Soy heredero</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
    </LinearGradient>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent', justifyContent: 'center', padding: 28 },
  emoji: { fontSize: 52, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 42, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  sub: { fontSize: 15, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 32 },
  input: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: 15, fontSize: 15, color: '#fff', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.2)', marginBottom: 12 },
  btn: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  toggle: { color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 20, fontSize: 14 },
  heredero: { color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 18, fontSize: 13 },
})
