import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { Boton } from '@/components/Boton'
import { COLORS, GRADIENTS } from '@/lib/constants'
import { comprarSuscripcion, restaurarCompras, getPrecioPlan } from '@/lib/iap'
import { useSuscripcion } from '@/store/suscripcion'

const BENEFICIOS = [
  'Clientes y préstamos ilimitados',
  'Cálculo automático de mora e intereses',
  'Recordatorios de cobro por WhatsApp',
  'Cobradores y carteras ilimitadas',
  'Notificaciones diarias de tus cobros',
  'Reportes de tu cartera al día',
]

export default function Suscripcion() {
  const router = useRouter()
  const { estado, diasRestantes } = useSuscripcion()
  const [precio, setPrecio] = useState('US$9.99/mes')
  const [cargando, setCargando] = useState(false)

  useEffect(() => {
    getPrecioPlan().then(setPrecio)
  }, [])

  async function suscribir() {
    setCargando(true)
    try {
      const ok = await comprarSuscripcion()
      if (ok) {
        Alert.alert('¡Listo!', 'Tu suscripción está activa. Gracias por usar Kuotas 💙', [
          { text: 'Continuar', onPress: () => router.back() },
        ])
      }
    } catch (e: any) {
      // El usuario cancelando la compra no es un error que mostrar.
      if (!String(e?.message ?? '').toLowerCase().includes('cancel')) {
        Alert.alert('No se pudo completar', e?.message ?? 'Inténtalo de nuevo.')
      }
    } finally {
      setCargando(false)
    }
  }

  async function restaurar() {
    setCargando(true)
    try {
      const ok = await restaurarCompras()
      Alert.alert(ok ? 'Restaurado' : 'Sin compras', ok ? 'Tu suscripción fue restaurada.' : 'No encontramos una suscripción activa.')
      if (ok) router.back()
    } finally {
      setCargando(false)
    }
  }

  const enPrueba = estado === 'prueba'

  return (
    <LinearGradient colors={GRADIENTS.authBg} style={s.bg}>
      <ScrollView contentContainerStyle={s.content}>
        {estado !== 'expirada' && (
          <TouchableOpacity style={s.cerrar} onPress={() => router.back()}>
            <Feather name="x" size={24} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        )}

        <View style={s.iconWrap}><Feather name="zap" size={34} color="#fff" /></View>
        <Text style={s.title}>Kuotas Pro</Text>

        {enPrueba ? (
          <Text style={s.sub}>Te quedan {diasRestantes} {diasRestantes === 1 ? 'día' : 'días'} de prueba gratis.</Text>
        ) : estado === 'expirada' ? (
          <Text style={s.sub}>Tu prueba terminó. Suscríbete para volver a registrar cobros y préstamos.</Text>
        ) : (
          <Text style={s.sub}>Gestiona tu cartera sin límites.</Text>
        )}

        <View style={s.card}>
          {BENEFICIOS.map((b) => (
            <View key={b} style={s.fila}>
              <Feather name="check" size={18} color={COLORS.success} />
              <Text style={s.beneficio}>{b}</Text>
            </View>
          ))}
        </View>

        <Text style={s.precio}>{precio}</Text>
        <Text style={s.nota}>
          {estado === 'expirada'
            ? 'Cancela cuando quieras desde tu cuenta de la tienda.'
            : 'Después de la prueba se cobra automáticamente. Cancela cuando quieras.'}
        </Text>

        {cargando ? (
          <ActivityIndicator color="#fff" style={{ marginTop: 20 }} />
        ) : (
          <Boton label="Suscribirme" icon="zap" onPress={suscribir} style={{ marginTop: 18, width: '100%' }} />
        )}

        <TouchableOpacity onPress={restaurar} disabled={cargando} style={s.restaurar}>
          <Text style={s.restaurarText}>Restaurar compra</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  )
}

const s = StyleSheet.create({
  bg: { flex: 1 },
  content: { padding: 24, paddingTop: 64, paddingBottom: 48, alignItems: 'center' },
  cerrar: { position: 'absolute', top: 56, right: 20, padding: 6, zIndex: 2 },
  iconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title: { fontSize: 30, fontWeight: '800', color: '#fff' },
  sub: { fontSize: 15, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 8, marginBottom: 20, lineHeight: 21 },
  card: { width: '100%', backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 20, padding: 20, gap: 14 },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  beneficio: { fontSize: 15, color: COLORS.text, fontWeight: '600', flex: 1 },
  precio: { fontSize: 26, fontWeight: '800', color: '#fff', marginTop: 22 },
  nota: { fontSize: 12, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginTop: 6, paddingHorizontal: 12 },
  restaurar: { marginTop: 16, padding: 8 },
  restaurarText: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600', textDecorationLine: 'underline' },
})
