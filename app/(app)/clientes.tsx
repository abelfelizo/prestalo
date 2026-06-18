import { useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { getClientes } from '@/api/clientes'
import { useSession } from '@/store/session'
import { COLORS } from '@/lib/constants'

export default function Clientes() {
  const router = useRouter()
  const carteraId = useSession((s) => s.carteraActivaId)
  const [q, setQ] = useState('')
  const { data, isLoading } = useQuery({
    queryKey: ['clientes', carteraId],
    queryFn: () => getClientes(carteraId!),
    enabled: !!carteraId,
  })

  if (isLoading) return <View style={s.center}><ActivityIndicator color={COLORS.primary} /></View>

  const term = q.trim().toLowerCase()
  const clientes = (data ?? []).filter(
    (c) => !term || c.nombre.toLowerCase().includes(term) || (c.telefono ?? '').includes(term),
  )

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Clientes</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => router.push('/cliente/nuevo')}>
          <Feather name="plus" size={15} color="#fff" />
          <Text style={s.addText}>Nuevo</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={s.search}
        value={q}
        onChangeText={setQ}
        placeholder="Buscar por nombre o teléfono"
        placeholderTextColor="#bbb"
      />
      {clientes.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyEmoji}>👥</Text>
          <Text style={s.emptyTitle}>Sin clientes</Text>
          <Text style={s.emptySub}>Agrega tu primer cliente</Text>
        </View>
      ) : (
        <FlatList
          data={clientes}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.card} onPress={() => router.push(`/cliente/${item.id}`)}>
              <View style={s.avatar}><Text style={s.avatarText}>{item.nombre.slice(0, 2).toUpperCase()}</Text></View>
              <View style={s.info}>
                <Text style={s.nombre}>{item.nombre}</Text>
                {!!item.telefono && <Text style={s.tel}>{item.telefono}</Text>}
              </View>
              <View style={[s.score, item.score >= 80 && s.scoreGood, item.score < 50 && s.scoreBad]}>
                <Text style={s.scoreText}>{item.score}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
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
  search: { marginHorizontal: 16, marginBottom: 6, backgroundColor: COLORS.surface, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: COLORS.text, borderWidth: 1.5, borderColor: COLORS.border },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  emptySub: { fontSize: 13, color: COLORS.textLight, marginTop: 4 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.bg, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 14, padding: 14, marginBottom: 8 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  info: { flex: 1 },
  nombre: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  tel: { fontSize: 12, color: COLORS.textLight, marginTop: 1 },
  score: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  scoreGood: { backgroundColor: '#e8f5e9' },
  scoreBad: { backgroundColor: '#ffebee' },
  scoreText: { fontSize: 12, fontWeight: '700', color: COLORS.text },
})
