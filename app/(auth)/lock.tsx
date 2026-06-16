import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { verificarPinLocal, biometriaDisponible, autenticarBiometria } from '@/lib/pin'
import { useSession } from '@/store/session'
import { COLORS } from '@/lib/constants'

export default function Lock() {
  const router = useRouter()
  const { setDesbloqueado } = useSession()
  const [pin, setPin] = useState('')

  function desbloquear() {
    setDesbloqueado(true)
    router.replace('/(app)/dashboard')
  }

  useEffect(() => {
    ;(async () => {
      if (await biometriaDisponible()) {
        if (await autenticarBiometria()) desbloquear()
      }
    })()
  }, [])

  async function onNumero(n: string) {
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
  }

  const teclado = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']

  return (
    <View style={s.container}>
      <Text style={s.title}>Préstalo</Text>
      <Text style={s.sub}>Ingresa tu PIN</Text>
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
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { fontSize: 34, fontWeight: '800', color: COLORS.gold, marginBottom: 8 },
  sub: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 40 },
  dots: { flexDirection: 'row', gap: 16, marginBottom: 52 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)' },
  dotActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: 288, gap: 12, justifyContent: 'center' },
  key: { width: 84, height: 84, borderRadius: 42, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  keyHidden: { backgroundColor: 'transparent' },
  keyText: { fontSize: 26, fontWeight: '500', color: '#fff' },
})
