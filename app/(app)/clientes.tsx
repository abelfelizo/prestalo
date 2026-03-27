import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useEffect, useState } from 'react'
import { getClientes } from '../../lib/db'
import { getCarteraActiva } from '../../lib/storage'
import { COLORS } from '../../constants'

export default function Clientes() {
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCarteraActiva().then(id => {
      if (id) return getClientes(id)
      return []
    }).then(data => setClientes(data)).catch(console.log).finally(() => setLoading(false))
  }, [])

  if (loading) return <View style={s.center}><ActivityIndicator color={COLORS.primary} /></View>

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Clientes</Text>
        <TouchableOpacity style={s.addBtn}>
          <Text style={s.addText}>+ Nuevo</Text>
        </TouchableOpacity>
      </View>
      {clientes.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyEmoji}>👥</Text>
          <Text style={s.emptyTitle}>Sin clientes</Text>
          <Text style={s.emptySub}>Agrega tu primer cliente</Text>
        </View>
      ) : (
        <FlatList
          data={clientes}
          keyExtractor={i => i.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.card}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{item.nombre.slice(0,2).toUpperCase()}</Text>
              </View>
              <View style={s.info}>
                <Text style={s.nombre}>{item.nombre}</Text>
                {item.apodo && <Text style={s.apodo}>"{item.apodo}"</Text>}
                {item.telefono && <Text style={s.tel}>{item.telefono}</Text>}
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
  addBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  addText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  emptySub: { fontSize: 13, color: COLORS.textLight, marginTop: 4 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.bg, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 14, padding: 14, marginBottom: 8 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ede7f6', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  info: { flex: 1 },
  nombre: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  apodo: { fontSize: 12, color: COLORS.textLight, marginTop: 1 },
  tel: { fontSize: 12, color: COLORS.textLight, marginTop: 1 },
  score: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  scoreGood: { backgroundColor: '#e8f5e9' },
  scoreBad: { backgroundColor: '#ffebee' },
  scoreText: { fontSize: 12, fontWeight: '700', color: COLORS.text },
})
