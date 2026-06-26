import { useState } from 'react'
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { getCarterasAccesibles, setCarteraActiva, invitarColaborador } from '@/api/prestamistas'
import { getHerederos, eliminarHeredero } from '@/api/herederos'
import { signOut, eliminarCuenta } from '@/api/auth'
import { limpiarPinLocal } from '@/lib/pin'
import { queryClient } from '@/lib/queryClient'
import { useSession } from '@/store/session'
import { usePinPrompt } from '@/store/pinPrompt'
import { COLORS, COLOR_CARTERA } from '@/lib/constants'
import type { ColorCartera } from '@/types'

export default function Ajustes() {
  const router = useRouter()
  const { prestamistaId, carteraActivaId, setCarteraActiva: setActivaLocal, setMoneda, reset } = useSession()
  const pedirPin = usePinPrompt((s) => s.pedirPin)
  const [emailColab, setEmailColab] = useState('')

  const carteras = useQuery({
    queryKey: ['carteras-accesibles'],
    queryFn: getCarterasAccesibles,
  })

  const herederos = useQuery({
    queryKey: ['herederos', prestamistaId],
    queryFn: () => getHerederos(prestamistaId!),
    enabled: !!prestamistaId,
  })

  async function cambiarCartera(id: string, moneda: string) {
    if (prestamistaId) await setCarteraActiva(prestamistaId, id).catch(() => {})
    setActivaLocal(id)
    setMoneda(moneda)
    queryClient.invalidateQueries()
    Alert.alert('Cartera activa actualizada')
  }

  async function compartir() {
    if (!carteraActivaId) return
    if (!emailColab.trim()) return Alert.alert('Escribe el email del cobrador')
    try {
      const r = await invitarColaborador(carteraActivaId, emailColab.trim())
      if (r === 'no_existe') {
        Alert.alert('No encontrado', 'Ese email no tiene cuenta en Kuotas. Pídele que se registre primero.')
      } else {
        setEmailColab('')
        Alert.alert('Listo', 'La cartera fue compartida con ese cobrador.')
      }
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo compartir')
    }
  }

  async function borrarCuenta() {
    Alert.alert(
      'Eliminar cuenta',
      'Esto borrará PERMANENTEMENTE tu cuenta y todos tus datos (clientes, préstamos, pagos y caja). Esta acción NO se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar todo',
          style: 'destructive',
          onPress: () =>
            pedirPin(async () => {
              try {
                await eliminarCuenta()
                await limpiarPinLocal()
                reset()
                queryClient.clear()
                router.replace('/(auth)/login')
              } catch (e: any) {
                Alert.alert('Error', e.message ?? 'No se pudo eliminar la cuenta')
              }
            }, 'PIN para eliminar tu cuenta'),
        },
      ],
    )
  }

  async function cerrarSesion() {
    Alert.alert('Cerrar sesión', '¿Seguro que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          await signOut()
          await limpiarPinLocal()
          reset()
          queryClient.clear()
          router.replace('/(auth)/login')
        },
      },
    ])
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 16, paddingTop: 56, paddingBottom: 110 }}>
      <Text style={s.title}>Ajustes</Text>

      <Text style={s.section}>Mis carteras</Text>
      {carteras.isLoading ? (
        <ActivityIndicator color={COLORS.primary} />
      ) : (
        (carteras.data ?? []).map((c) => (
          <TouchableOpacity key={c.id} style={s.cartera} onPress={() => cambiarCartera(c.id, c.moneda)}>
            <View style={[s.dot, { backgroundColor: COLOR_CARTERA[c.color as ColorCartera] ?? COLORS.primary }]} />
            <Text style={s.carteraNombre}>{c.nombre}</Text>
            <Text style={s.carteraMoneda}>{c.moneda}</Text>
            {carteraActivaId === c.id && <Text style={s.activa}>✓ activa</Text>}
          </TouchableOpacity>
        ))
      )}
      <TouchableOpacity style={s.link} onPress={() => router.push('/cartera/nueva')}>
        <Feather name="plus-circle" size={18} color={COLORS.primary} />
        <Text style={s.linkText}>Nueva cartera</Text>
        <Feather name="chevron-right" size={18} color={COLORS.textLight} style={s.chev} />
      </TouchableOpacity>

      {!!prestamistaId && (
        <>
          <Text style={s.section}>Compartir cartera activa</Text>
          <Text style={s.hint}>Invita a un cobrador (debe tener cuenta en Kuotas).</Text>
          <View style={s.shareRow}>
            <TextInput
              style={s.shareInput}
              value={emailColab}
              onChangeText={setEmailColab}
              placeholder="email del cobrador"
              placeholderTextColor="#bbb"
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TouchableOpacity style={s.shareBtn} onPress={compartir}>
              <Feather name="user-plus" size={15} color="#fff" />
              <Text style={s.shareBtnText}>Invitar</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <Text style={s.section}>Cobranza</Text>
      <TouchableOpacity style={s.link} onPress={() => router.push('/reportes')}>
        <Feather name="bar-chart-2" size={18} color={COLORS.primary} />
        <Text style={s.linkText}>Reportes</Text>
        <Feather name="chevron-right" size={18} color={COLORS.textLight} style={s.chev} />
      </TouchableOpacity>
      <TouchableOpacity style={s.link} onPress={() => router.push('/config-mora')}>
        <Feather name="settings" size={18} color={COLORS.primary} />
        <Text style={s.linkText}>Configuración de mora</Text>
        <Feather name="chevron-right" size={18} color={COLORS.textLight} style={s.chev} />
      </TouchableOpacity>

      <Text style={s.section}>Herederos</Text>
      {(herederos.data ?? []).map((h) => (
        <TouchableOpacity
          key={h.id}
          style={s.heredero}
          onLongPress={() =>
            pedirPin(async () => {
              await eliminarHeredero(h.id)
              queryClient.invalidateQueries({ queryKey: ['herederos', prestamistaId] })
            }, `PIN para eliminar a ${h.nombre}`)
          }
        >
          <Text style={s.herederoNombre}>{h.nombre}</Text>
          <Text style={s.herederoSub}>{h.relacion} · {h.telefono} · mantén presionado para eliminar</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={s.link} onPress={() => router.push('/heredero/nuevo')}>
        <Feather name="user-plus" size={18} color={COLORS.primary} />
        <Text style={s.linkText}>Agregar heredero</Text>
        <Feather name="chevron-right" size={18} color={COLORS.textLight} style={s.chev} />
      </TouchableOpacity>

      <TouchableOpacity style={s.logout} onPress={cerrarSesion}>
        <Text style={s.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>

      <Text style={s.section}>Zona de peligro</Text>
      <TouchableOpacity style={s.danger} onPress={borrarCuenta}>
        <Feather name="trash-2" size={16} color={COLORS.danger} />
        <Text style={s.dangerText}>Eliminar mi cuenta y todos mis datos</Text>
      </TouchableOpacity>
      <Text style={s.hint}>Borra permanentemente tu cuenta. No se puede deshacer.</Text>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 16, paddingTop: 56 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  section: { fontSize: 11, fontWeight: '700', color: '#ccc', textTransform: 'uppercase', letterSpacing: 1, marginTop: 24, marginBottom: 10 },
  cartera: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginBottom: 8 },
  dot: { width: 16, height: 16, borderRadius: 8 },
  carteraNombre: { flex: 1, fontSize: 15, fontWeight: '700', color: COLORS.text },
  carteraMoneda: { fontSize: 13, color: COLORS.textLight },
  activa: { fontSize: 12, color: COLORS.success, fontWeight: '700', marginLeft: 8 },
  link: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12 },
  linkText: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  chev: { marginLeft: 'auto' },
  hint: { fontSize: 12, color: COLORS.textLight, marginBottom: 8 },
  shareRow: { flexDirection: 'row', gap: 8 },
  shareInput: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: COLORS.text, borderWidth: 1.5, borderColor: COLORS.border },
  shareBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  shareBtnText: { color: '#fff', fontWeight: '700' },
  heredero: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginBottom: 8 },
  herederoNombre: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  herederoSub: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  logout: { marginTop: 32, borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: COLORS.danger },
  logoutText: { color: COLORS.danger, fontWeight: '700', fontSize: 15 },
  danger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: COLORS.danger },
  dangerText: { color: COLORS.danger, fontWeight: '700', fontSize: 14 },
})
