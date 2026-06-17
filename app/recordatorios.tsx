import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { getCobrosHoy } from '@/api/prestamos'
import { getConfigCartera } from '@/api/config'
import { cobrarPorWhatsApp } from '@/lib/whatsapp'
import { useFmt } from '@/lib/useFmt'
import { useSession } from '@/store/session'
import { COLORS } from '@/lib/constants'

export default function Recordatorios() {
  const router = useRouter()
  const f = useFmt()
  const moneda = useSession((s) => s.moneda)
  const carteraId = useSession((s) => s.carteraActivaId)

  const cobros = useQuery({
    queryKey: ['cobros-hoy', carteraId],
    queryFn: () => getCobrosHoy(carteraId!),
    enabled: !!carteraId,
  })
  const config = useQuery({
    queryKey: ['config', carteraId],
    queryFn: () => getConfigCartera(carteraId!),
    enabled: !!carteraId,
  })

  const lista = (cobros.data ?? []).filter((p) => !!p.clientes?.telefono)
  const plantilla = config.data?.mensaje_mora_whatsapp

  function enviar(tel: string, nombre: string, saldo: number) {
    cobrarPorWhatsApp(tel, nombre, saldo, moneda, plantilla)
  }

  if (cobros.isLoading) return <View style={s.center}><ActivityIndicator color={COLORS.primary} /></View>

  return (
    <View style={s.container}>
      <Text style={s.title}>Recordatorios de hoy</Text>
      <Text style={s.sub}>{lista.length} cliente(s) con teléfono. Toca para enviar el recordatorio por WhatsApp.</Text>

      <FlatList
        data={lista}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingVertical: 12 }}
        ListEmptyComponent={<Text style={s.empty}>No hay cobros con teléfono para hoy</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.card}
            onPress={() => enviar(item.clientes!.telefono!, item.clientes!.nombre, Number(item.saldo_pendiente))}
          >
            <View style={{ flex: 1 }}>
              <Text style={s.nombre}>{item.clientes?.nombre}</Text>
              <Text style={s.cardSub}>{item.clientes?.telefono} · saldo {f(item.saldo_pendiente)}</Text>
            </View>
            <Text style={s.wa}>💬</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Text style={s.back}>Volver</Text></TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingHorizontal: 16, paddingTop: 56 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.primary },
  sub: { fontSize: 13, color: COLORS.textLight, marginTop: 6 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, marginBottom: 8 },
  nombre: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  cardSub: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  wa: { fontSize: 24 },
  empty: { textAlign: 'center', color: COLORS.textLight, marginTop: 40 },
  backBtn: { padding: 16 },
  back: { textAlign: 'center', color: COLORS.textLight, fontSize: 14 },
})
