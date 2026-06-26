import { Component, type ReactNode } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { COLORS } from '@/lib/constants'

interface Props { children: ReactNode }
interface State { error: Error | null }

/**
 * Captura errores de render para que un fallo no deje la app en pantalla en blanco.
 * Los datos están a salvo en el servidor; esto solo protege la UI y permite reintentar.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error) {
    // Punto de enganche para Sentry/Crashlytics cuando se integre.
    console.error('ErrorBoundary capturó:', error)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <View style={s.c}>
        <Feather name="alert-triangle" size={48} color={COLORS.warning} />
        <Text style={s.title}>Algo salió mal</Text>
        <Text style={s.sub}>Tus datos están seguros. Reinicia la pantalla para continuar.</Text>
        <TouchableOpacity style={s.btn} onPress={() => this.setState({ error: null })}>
          <Text style={s.btnText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    )
  }
}

const s = StyleSheet.create({
  c: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: COLORS.bg, gap: 12 },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.text, marginTop: 8 },
  sub: { fontSize: 14, color: COLORS.textLight, textAlign: 'center', lineHeight: 20 },
  btn: { marginTop: 12, backgroundColor: COLORS.primary, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 14 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
