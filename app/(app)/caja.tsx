import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Alert } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { getMovimientos, getBalanceCaja, eliminarMovimiento } from '@/api/caja'
import { queryClient } from '@/lib/queryClient'
import { useFmt } from '@/lib/useFmt'
import { useSession } from '@/store/session'
import { usePinPrompt } from '@/store/pinPrompt'
import { exigirSuscripcion } from '@/lib/guard'
import { COLORS, GRADIENTS } from '@/lib/constants'

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
  const pedirPin = usePinPrompt((s) => s.pedirPin)

  const balance = useQuery({
    queryKey: ['caja-balance', carteraId],
    queryFn: () => getBalanceCaja(carteraId!),
    enabled: !!carteraId,
  })
  const movs = useQuery({
    queryKey: ['caja', carteraId],
    queryFn: () => getMovimientos(carteraId!),
    enabled: !!carteraId,
  })

  if (movs.isLoading) return <View style={s.center}><ActivityIndicator color={COLORS.primary} /></View>

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Caja</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => exigirSuscripcion(router) && router.push('/caja/nuevo')}>
          <Feather name="plus" size={15} color="#fff" />
          <Text style={s.addText}>Movimiento</Text>
        </TouchableOpacity>
      </View>

      <LinearGradient colors={GRADIENTS.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.balanceBox}>
        <Text style={s.balanceLabel}>Balance en caja</Text>
        <Text style={s.balanceVal}>{f(balance.data ?? 0)}</Text>
      </LinearGradient>

      <FlatList
        data={movs.data ?? []}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
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
              <View style={{ flex: 1 }}>
                <Text style={s.cat}>{CAT_LABEL[item.categoria] ?? item.categoria}</Text>
                {!!item.descripcion && <Text style={s.desc}>{item.descripcion}</Text>}
                <Text style={s.fecha}>{item.fecha}{editable ? ' · mantén presionado' : ''}</Text>
              </View>
              <Text style={[s.monto, { color: entrada ? COLORS.success : COLORS.danger }]}>
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
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 56 },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  addBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 5 },
  addText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  balanceBox: { marginHorizontal: 16, borderRadius: 20, padding: 22, alignItems: 'center', overflow: 'hidden' },
  balanceLabel: { fontSize: 12.5, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },
  balanceVal: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.bg, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 14, marginBottom: 8 },
  cat: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  desc: { fontSize: 12, color: COLORS.textLight, marginTop: 1 },
  fecha: { fontSize: 11, color: COLORS.textLight, marginTop: 2 },
  monto: { fontSize: 15, fontWeight: '800' },
  empty: { textAlign: 'center', color: COLORS.textLight, marginTop: 40 },
})
