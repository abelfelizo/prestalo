import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { signIn, signUp } from '@/api/auth'
import { emailValido } from '@/lib/validar'
import { color, font, gradient, radius, shadowRaised } from '@/theme'

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
    <View style={{ flex: 1, backgroundColor: color.primaryDeep }}>
      <LinearGradient colors={gradient.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      {/* Capas de color suaves (aproximan los radiales del diseño) */}
      <LinearGradient
        colors={[color.violet, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 0.6 }}
        style={[StyleSheet.absoluteFill, { opacity: 0.55 }]}
      />
      <LinearGradient
        colors={['transparent', color.cyan]}
        start={{ x: 0.4, y: 0.5 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { opacity: 0.4 }]}
      />

      <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.logo}>
          <Text style={s.logoK}>K</Text>
        </View>
        <Text style={s.title}>Kuotas</Text>
        <Text style={s.sub}>Tu cartera, bajo control.</Text>

        <View style={s.form}>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            placeholder="tucorreo@ejemplo.com"
            placeholderTextColor="rgba(255,255,255,0.5)"
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={s.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Contraseña"
            placeholderTextColor="rgba(255,255,255,0.5)"
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={s.btn} onPress={submit} disabled={loading} activeOpacity={0.9}>
          {loading ? <ActivityIndicator color={color.primary} /> : (
            <Text style={s.btnText}>{modo === 'entrar' ? 'Entrar' : 'Crear cuenta'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setModo(modo === 'entrar' ? 'crear' : 'entrar')}>
          <Text style={s.toggle}>
            {modo === 'entrar' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
            <Text style={s.toggleAccent}>{modo === 'entrar' ? 'Crear una' : 'Inicia sesión'}</Text>
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.heredero} onPress={() => router.push('/heredero-acceso')}>
          <Feather name="user" size={15} color="rgba(255,255,255,0.7)" />
          <Text style={s.herederoText}>Soy heredero</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 30 },
  logo: {
    width: 72, height: 72, borderRadius: radius.xxl, backgroundColor: color.surface,
    alignItems: 'center', justifyContent: 'center', marginBottom: 22,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 30, shadowOffset: { width: 0, height: 12 }, elevation: 8,
  },
  logoK: { fontFamily: font.display, fontSize: 38, color: color.primary, lineHeight: 46 },
  title: { fontFamily: font.display, fontSize: 40, color: '#fff', letterSpacing: -1.5, lineHeight: 46 },
  sub: { fontFamily: font.body, fontSize: 15, color: 'rgba(255,255,255,0.72)', marginTop: 8, marginBottom: 34 },
  form: { gap: 12 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 15,
    fontFamily: font.body, fontSize: 14, color: '#fff', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.22)',
  },
  btn: { backgroundColor: '#fff', borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center', marginTop: 18, ...shadowRaised, shadowColor: '#000', shadowOpacity: 0.2 },
  btnText: { fontFamily: font.bodyBold, fontSize: 15, color: color.primary },
  toggle: { fontFamily: font.body, fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 22 },
  toggleAccent: { fontFamily: font.bodyBold, color: color.cyanLight },
  heredero: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 18 },
  herederoText: { fontFamily: font.bodySemi, fontSize: 13, color: 'rgba(255,255,255,0.7)' },
})
