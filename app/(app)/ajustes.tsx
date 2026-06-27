import { useState } from 'react'
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { getCarterasAccesibles, setCarteraActiva, invitarColaborador } from '@/api/prestamistas'
import { getHerederos, eliminarHeredero } from '@/api/herederos'
import { signOut, eliminarCuenta } from '@/api/auth'
import { limpiarPinLocal } from '@/lib/pin'
import { queryClient } from '@/lib/queryClient'
import { useSession } from '@/store/session'
import { usePinPrompt } from '@/store/pinPrompt'
import { COLOR_CARTERA } from '@/lib/constants'
import { color, font, radius, shadowCard, gradient } from '@/theme'
import type { ColorCartera } from '@/types'

type IconName = keyof typeof Feather.glyphMap

export default function Ajustes() {
  const router = useRouter()
  const { prestamistaId, carteraActivaId, setCarteraActiva: setActivaLocal, setMoneda, reset } = useSession()
  const pedirPin = usePinPrompt((s) => s.pedirPin)
  const [emailColab, setEmailColab] = useState('')

  const carteras = useQuery({ queryKey: ['carteras-accesibles'], queryFn: getCarterasAccesibles })
  const herederos = useQuery({ queryKey: ['herederos', prestamistaId], queryFn: () => getHerederos(prestamistaId!), enabled: !!prestamistaId })

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

  function Fila({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
    return (
      <TouchableOpacity style={s.link} onPress={onPress} activeOpacity={0.7}>
        <View style={s.linkIcon}><Feather name={icon} size={17} color={color.primary} /></View>
        <Text style={s.linkText}>{label}</Text>
        <Feather name="chevron-right" size={18} color={color.faint} style={s.chev} />
      </TouchableOpacity>
    )
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 56, paddingBottom: 110 }}>
      <Text style={s.title}>Ajustes</Text>

      <View style={s.profile}>
        <LinearGradient colors={gradient.profile} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={s.profileAvatar}><Feather name="user" size={22} color="#fff" /></View>
        <View style={{ flex: 1 }}>
          <Text style={s.profileName}>Mi cuenta</Text>
          <Text style={s.profileSub}>Prestamista · Plan Pro</Text>
        </View>
      </View>

      <Text style={s.section}>Mis carteras</Text>
      {carteras.isLoading ? (
        <ActivityIndicator color={color.primary} />
      ) : (
        (carteras.data ?? []).map((c) => (
          <TouchableOpacity key={c.id} style={s.cartera} onPress={() => cambiarCartera(c.id, c.moneda)} activeOpacity={0.7}>
            <View style={[s.dot, { backgroundColor: COLOR_CARTERA[c.color as ColorCartera] ?? color.primary }]} />
            <Text style={s.carteraNombre}>{c.nombre}</Text>
            <Text style={s.carteraMoneda}>{c.moneda}</Text>
            {carteraActivaId === c.id && <Text style={s.activa}>✓ activa</Text>}
          </TouchableOpacity>
        ))
      )}
      <Fila icon="plus-circle" label="Nueva cartera" onPress={() => router.push('/cartera/nueva')} />

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
              placeholderTextColor={color.faint}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TouchableOpacity style={s.shareBtn} onPress={compartir} activeOpacity={0.9}>
              <Feather name="user-plus" size={15} color="#fff" />
              <Text style={s.shareBtnText}>Invitar</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <Text style={s.section}>Cobranza</Text>
      <Fila icon="bar-chart-2" label="Reportes" onPress={() => router.push('/reportes')} />
      <Fila icon="settings" label="Configuración de mora" onPress={() => router.push('/config-mora')} />

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
      <Fila icon="user-plus" label="Agregar heredero" onPress={() => router.push('/heredero/nuevo')} />

      <TouchableOpacity style={s.logout} onPress={cerrarSesion} activeOpacity={0.8}>
        <Text style={s.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>

      <Text style={s.section}>Zona de peligro</Text>
      <TouchableOpacity style={s.danger} onPress={borrarCuenta} activeOpacity={0.8}>
        <Feather name="trash-2" size={16} color={color.danger} />
        <Text style={s.dangerText}>Eliminar mi cuenta y todos mis datos</Text>
      </TouchableOpacity>
      <Text style={s.hint}>Borra permanentemente tu cuenta. No se puede deshacer.</Text>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg },
  title: { fontFamily: font.display, fontSize: 24, color: color.ink, letterSpacing: -0.6, marginBottom: 16 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: radius.card, overflow: 'hidden', marginBottom: 8 },
  profileAvatar: { width: 48, height: 48, borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  profileName: { fontFamily: font.displaySemi, fontSize: 17, color: '#fff' },
  profileSub: { fontFamily: font.body, fontSize: 12.5, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  section: { fontFamily: font.bodyBold, fontSize: 11, color: color.faint, textTransform: 'uppercase', letterSpacing: 1, marginTop: 24, marginBottom: 10 },
  cartera: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: color.surface, borderRadius: radius.lg, padding: 14, marginBottom: 8, ...shadowCard },
  dot: { width: 14, height: 14, borderRadius: 7 },
  carteraNombre: { flex: 1, fontFamily: font.bodyBold, fontSize: 15, color: color.ink },
  carteraMoneda: { fontFamily: font.bodySemi, fontSize: 13, color: color.muted },
  activa: { fontFamily: font.bodyBold, fontSize: 12, color: color.success, marginLeft: 8 },
  link: { backgroundColor: color.surface, borderRadius: radius.lg, padding: 13, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 12, ...shadowCard },
  linkIcon: { width: 34, height: 34, borderRadius: radius.sm, backgroundColor: color.indigoTint, alignItems: 'center', justifyContent: 'center' },
  linkText: { fontFamily: font.bodySemi, fontSize: 15, color: color.ink },
  chev: { marginLeft: 'auto' },
  hint: { fontFamily: font.body, fontSize: 12, color: color.muted, marginBottom: 8 },
  shareRow: { flexDirection: 'row', gap: 8 },
  shareInput: { flex: 1, backgroundColor: color.surface, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 11, fontFamily: font.body, fontSize: 14, color: color.ink, ...shadowCard },
  shareBtn: { backgroundColor: color.primary, borderRadius: radius.md, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  shareBtnText: { fontFamily: font.bodyBold, color: '#fff', fontSize: 14 },
  heredero: { backgroundColor: color.surface, borderRadius: radius.lg, padding: 14, marginBottom: 8, ...shadowCard },
  herederoNombre: { fontFamily: font.bodyBold, fontSize: 15, color: color.ink },
  herederoSub: { fontFamily: font.body, fontSize: 12, color: color.muted, marginTop: 2 },
  logout: { marginTop: 28, borderRadius: radius.lg, padding: 15, alignItems: 'center', backgroundColor: color.surface, ...shadowCard },
  logoutText: { fontFamily: font.bodyBold, color: color.danger, fontSize: 15 },
  danger: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: color.dangerTint, borderRadius: radius.lg, padding: 15, borderWidth: 1.5, borderColor: color.danger },
  dangerText: { fontFamily: font.bodyBold, color: color.danger, fontSize: 14 },
})
