import { useState } from 'react'
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { verificarPinLocal } from '@/lib/pin'
import { usePinPrompt } from '@/store/pinPrompt'
import { COLORS } from '@/lib/constants'

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
      if (await verificarPinLocal(nuevo)) {
        const cb = onSuccess
        cerrar()
        reset()
        cb?.()
      } else {
        setError(true)
        setPin('')
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
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 24, alignItems: 'center', width: '100%', maxWidth: 340 },
  titulo: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginTop: 10, textAlign: 'center' },
  error: { color: COLORS.danger, fontWeight: '700', marginTop: 8, fontSize: 13 },
  dots: { flexDirection: 'row', gap: 14, marginVertical: 20 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: COLORS.border },
  dotOn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', width: 252, gap: 10, justifyContent: 'center' },
  key: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  keyHidden: { backgroundColor: 'transparent' },
  keyText: { fontSize: 24, fontWeight: '600', color: COLORS.text },
  cancel: { color: COLORS.textLight, marginTop: 18, fontSize: 14 },
})
