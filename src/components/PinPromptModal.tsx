import { useState } from 'react'
import { Modal, View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { verificarPinLocal, pinBloqueadoMs, registrarFalloPin } from '@/lib/pin'
import { usePinPrompt } from '@/store/pinPrompt'
import { color as COLORS, font, radius } from '@/theme'

const TECLADO = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫']

export function PinPromptModal() {
  const { visible, mensaje, onSuccess, cerrar } = usePinPrompt()
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  function reset() {
    setPin('')
    setError(false)
  }

  async function onNumero(n: string) {
    const nuevo = pin + n
    if (nuevo.length > 4) return
    setPin(nuevo)
    setError(false)
    if (nuevo.length === 4) {
      if ((await pinBloqueadoMs()) > 0) {
        setPin('')
        cerrar()
        reset()
        Alert.alert('Demasiados intentos', 'Espera unos minutos antes de volver a intentarlo.')
        return
      }
      if (await verificarPinLocal(nuevo)) {
        const cb = onSuccess
        cerrar()
        reset()
        cb?.()
      } else {
        setPin('')
        const r = await registrarFalloPin()
        if (r.bloqueado) {
          cerrar()
          reset()
          Alert.alert('Demasiados intentos', 'Espera unos minutos antes de volver a intentarlo.')
        } else {
          setError(true)
        }
      }
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => { cerrar(); reset() }}>
      <View style={s.backdrop}>
        <View style={s.card}>
          <Feather name="lock" size={26} color={COLORS.primary} />
          <Text style={s.titulo}>{mensaje}</Text>
          {error && <Text style={s.error}>PIN incorrecto</Text>}
          <View style={s.dots}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[s.dot, pin.length > i && s.dotOn]} />
            ))}
          </View>
          <View style={s.grid}>
            {TECLADO.map((n, i) => (
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
          <TouchableOpacity onPress={() => { cerrar(); reset() }}>
            <Text style={s.cancel}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: '#fff', borderRadius: radius.card, padding: 24, alignItems: 'center', width: '100%', maxWidth: 340 },
  titulo: { fontFamily: font.displaySemi, fontSize: 16, color: COLORS.ink, marginTop: 10, textAlign: 'center' },
  error: { fontFamily: font.bodyBold, color: COLORS.danger, marginTop: 8, fontSize: 13 },
  dots: { flexDirection: 'row', gap: 14, marginVertical: 20 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: COLORS.line },
  dotOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: 252, gap: 10, justifyContent: 'center' },
  key: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  keyHidden: { backgroundColor: 'transparent' },
  keyText: { fontFamily: font.displaySemi, fontSize: 24, color: COLORS.ink },
  cancel: { fontFamily: font.bodySemi, color: COLORS.muted, marginTop: 18, fontSize: 14 },
})
