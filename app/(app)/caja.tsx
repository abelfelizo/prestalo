import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { getMovimientos, getBalanceCaja, eliminarMovimiento } from '@/api/caja'
import { queryClient } from '@/lib/queryClient'
import { useFmt } from '@/lib/useFmt'
import { useSession } from '@/store/session'
import { usePinPrompt } from '@/store/pinPrompt'
import { exigirSuscripcion } from '@/lib/guard'
import { color, font, radius, shadowCard, shadowRaised, gradient } from '@/theme'

const MANUALES = ['capital_nuevo', 'retiro_personal', 'otro']

const CAT_LABEL: Record<string, string> = {
  capital_nuevo: 'Capital nuevo',
  cobro: 'Cobro',
  cobro_mora: 'Mora cobrada',
  desembolso: 'Desembolso',
  retiro_personal: 'Retiro',
  otro: 'Otro',
}

export default function Caja() {
  const router = useRouter()
  const f = useFmt()
  const carteraId = useSession((s) => s.carteraActivaId)
  const esColaborador = useSession((s) => s.esColaborador)
  const permisos = useSession((s) => s.permisos)
  const puedeCrear = !esColaborador || !!permisos.caja
  const pedirPin = usePinPrompt((s) => s.pedirPin)

  const balance = useQuery({ queryKey: ['caja-balance', carteraId], queryFn: () => getBalanceCaja(carteraId!), enabled: !!carteraId })
  const movs = useQuery({ queryKey: ['caja', carteraId], queryFn: () => getMovimientos(carteraId!), enabled: !!carteraId })

  if (movs.isLoading) return <View style={s.center}><ActivityIndicator color={color.primary} /></View>

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Caja</Text>
        {puedeCrear && (
          <TouchableOpacity style={s.addBtn} accessibilityLabel="Agregar movimiento de caja" accessibilityRole="button" onPress={() => exigirSuscripcion(router) && router.push('/caja/nuevo')} activeOpacity={0.9}>
            <Feather name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <View style={s.balanceBox}>
        <LinearGradient colors={gradient.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={[color.cyan, 'transparent']} start={{ x: 1, y: 1 }} end={{ x: 0.3, y: 0.2 }} style={[StyleSheet.absoluteFill, { opacity: 0.4 }]} />
        <Text style={s.balanceLabel}>Balance en caja</Text>
        <Text style={s.balanceVal}>{f(balance.data ?? 0)}</Text>
      </View>

      <Text style={s.section}>Movimientos</Text>
      <FlatList
        data={movs.data ?? []}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 110 }}
        ListEmptyComponent={<Text style={s.empty}>Sin movimientos todavía</Text>}
        renderItem={({ item }) => {
          const entrada = item.tipo === 'entrada'
          const editable = MANUALES.includes(item.categoria)
          return (
            <TouchableOpacity
              style={s.row}
              activeOpacity={editable ? 0.6 : 1}
              onLongPress={
                editable
                  ? () =>
                      Alert.alert('Movimiento', CAT_LABEL[item.categoria] ?? item.categoria, [
                        { text: 'Editar', onPress: () => router.push(`/caja/nuevo?id=${item.id}`) },
                        {
                          text: 'Eliminar',
                          style: 'destructive',
                          onPress: () =>
                            pedirPin(async () => {
                              await eliminarMovimiento(item.id)
                              queryClient.invalidateQueries({ queryKey: ['caja', carteraId] })
                              queryClient.invalidateQueries({ queryKey: ['caja-balance', carteraId] })
                            }, 'PIN para eliminar el movimiento'),
                        },
                        { text: 'Cancelar', style: 'cancel' },
                      ])
                  : undefined
              }
            >
              <View style={[s.icon, { backgroundColor: entrada ? color.successTint : color.dangerTint }]}>
                <Feather name={entrada ? 'arrow-up-right' : 'arrow-down-right'} size={17} color={entrada ? color.success : color.danger} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.cat}>{CAT_LABEL[item.categoria] ?? item.categoria}</Text>
                {!!item.descripcion && <Text style={s.desc}>{item.descripcion}</Text>}
                <Text style={s.fecha}>{item.fecha}{editable ? ' · mantén presionado' : ''}</Text>
              </View>
              <Text style={[s.monto, { color: entrada ? color.success : color.danger }]}>
                {entrada ? '+' : '−'} {f(item.monto)}
              </Text>
            </TouchableOpacity>
          )
        }}
      />
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingTop: 56, marginBottom: 14 },
  title: { fontFamily: font.display, fontSize: 24, color: color.ink, letterSpacing: -0.6 },
  addBtn: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: color.primary, alignItems: 'center', justifyContent: 'center', ...shadowRaised },
  balanceBox: { marginHorizontal: 18, borderRadius: radius.card, padding: 22, alignItems: 'center', overflow: 'hidden', ...shadowRaised },
  balanceLabel: { fontFamily: font.bodySemi, fontSize: 12.5, color: 'rgba(255,255,255,0.85)' },
  balanceVal: { fontFamily: font.display, fontSize: 32, color: '#fff', marginTop: 6, letterSpacing: -1, fontVariant: ['tabular-nums'] },
  section: { fontFamily: font.displaySemi, fontSize: 14, color: color.ink, marginHorizontal: 18, marginTop: 22, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: color.surface, borderRadius: radius.xl, padding: 13, marginBottom: 10, ...shadowCard },
  icon: { width: 38, height: 38, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  cat: { fontFamily: font.bodyBold, fontSize: 14, color: color.ink },
  desc: { fontFamily: font.body, fontSize: 12, color: color.muted, marginTop: 1 },
  fecha: { fontFamily: font.body, fontSize: 11, color: color.faint, marginTop: 2 },
  monto: { fontFamily: font.displaySemi, fontSize: 15, fontVariant: ['tabular-nums'] },
  empty: { fontFamily: font.body, textAlign: 'center', color: color.muted, marginTop: 40 },
})
