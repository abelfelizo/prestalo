import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { useRouter } from 'expo-router'
import { signIn, signUp } from '@/api/auth'
import { getPrestamista } from '@/api/prestamistas'
import { COLORS } from '@/lib/constants'

export default function Login() {
  const router = useRouter()
  const [modo, setModo] = useState<'entrar' | 'crear'>('entrar')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!email.trim() || password.length < 6) {
      Alert.alert('Datos incompletos', 'Ingresa un email válido y una contraseña de al menos 6 caracteres.')
      return
    }
    setLoading(true)
    try {
      const user = modo === 'entrar'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password)
      if (!user) {
        Alert.alert('Revisa tu correo', 'Confirma tu cuenta desde el email para continuar.')
        return
      }
      const prest = await getPrestamista(user.id)
      router.replace(prest ? '/(auth)/lock' : '/(auth)/onboarding')
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
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
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary, justifyContent: 'center', padding: 28 },
  emoji: { fontSize: 52, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 40, fontWeight: '800', color: COLORS.gold, textAlign: 'center' },
  sub: { fontSize: 15, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 32 },
  input: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 15, fontSize: 15, color: '#fff', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.12)', marginBottom: 12 },
  btn: { backgroundColor: COLORS.gold, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  toggle: { color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 20, fontSize: 14 },
})
