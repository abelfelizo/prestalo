import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { guardarPIN, verificarPIN, tienePIN, getCarteraActiva } from '../../lib/storage'
import { COLORS } from '../../constants'

export default function PIN() {
  const router = useRouter()
  const [pin, setPin] = useState('')
  const [modo, setModo] = useState<'crear' | 'verificar'>('crear')
  const [confirmar, setConfirmar] = useState('')
  const [paso, setPaso] = useState<'ingresar' | 'confirmar'>('ingresar')

  useEffect(() => {
    tienePIN().then(tiene => setModo(tiene ? 'verificar' : 'crear'))
  }, [])

  async function handleNumero(num: string) {
    if (modo === 'verificar') {
      const nuevo = pin + num
      setPin(nuevo)
      if (nuevo.length === 4) {
        const ok = await verificarPIN(nuevo)
        if (ok) {
          const cartera = await getCarteraActiva()
          if (cartera) {
            router.replace('/(app)/dashboard')
          } else {
            router.replace('/(auth)/setup')
          }
        } else {
          setPin('')
          Alert.alert('PIN incorrecto', 'Intenta de nuevo')
        }
      }
    } else {
      if (paso === 'ingresar') {
        const nuevo = pin + num
        setPin(nuevo)
        if (nuevo.length === 4) {
          setConfirmar(nuevo)
          setPin('')
          setPaso('confirmar')
        }
      } else {
        const nuevo = pin + num
        setPin(nuevo)
        if (nuevo.length === 4) {
          if (nuevo === confirmar) {
            await guardarPIN(nuevo)
            router.replace('/(auth)/setup')
          } else {
            setPin('')
            setPaso('ingresar')
            setConfirmar('')
            Alert.alert('No coinciden', 'Los PINs no coinciden. Intenta de nuevo.')
          }
        }
      }
    }
  }

  const teclado = ['1','2','3','4','5','6','7','8','9','','0','⌫']

  return (
    <View style={s.container}>
      <Text style={s.title}>Préstalo</Text>
      <Text style={s.sub}>
        {modo === 'verificar' ? 'Ingresa tu PIN' : paso === 'ingresar' ? 'Crea tu PIN de 4 dígitos' : 'Confirma tu PIN'}
      </Text>
      <View style={s.dots}>
        {[0,1,2,3].map(i => (
          <View key={i} style={[s.dot, pin.length > i && s.dotActive]} />
        ))}
      </View>
      <View style={s.grid}>
        {teclado.map((n, i) => (
          <TouchableOpacity
            key={i}
            style={[s.key, !n && s.keyHidden]}
            onPress={() => {
              if (!n) return
              if (n === '⌫') setPin(p => p.slice(0, -1))
              else if (pin.length < 4) handleNumero(n)
            }}
            disabled={!n}
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
  sub: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 40, textAlign: 'center' },
  dots: { flexDirection: 'row', gap: 16, marginBottom: 52 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)' },
  dotActive: { backgroundColor: COLORS.gold, borderColor: COLORS.gold },
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: 288, gap: 12, justifyContent: 'center' },
  key: { width: 84, height: 84, borderRadius: 42, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  keyHidden: { backgroundColor: 'transparent' },
  keyText: { fontSize: 26, fontWeight: '500', color: '#fff' },
})
