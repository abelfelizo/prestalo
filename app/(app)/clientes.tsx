import { useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { getClientes } from '@/api/clientes'
import { useSession } from '@/store/session'
import { exigirSuscripcion } from '@/lib/guard'
import { AvisoSuscripcion } from '@/components/AvisoSuscripcion'
import { color, font, radius, shadowCard, shadowRaised } from '@/theme'

function tintePorScore(score: number) {
  if (score >= 80) return { bg: color.successTint, fg: color.success }
  if (score < 50) return { bg: color.dangerTint, fg: color.danger }
  return { bg: color.indigoTint, fg: color.primary }
}

export default function Clientes() {
  const router = useRouter()
  const carteraId = useSession((s) => s.carteraActivaId)
  const [q, setQ] = useState('')
  const { data, isLoading } = useQuery({
    queryKey: ['clientes', carteraId],
    queryFn: () => getClientes(carteraId!),
    enabled: !!carteraId,
  })

  if (isLoading) return <View style={s.center}><ActivityIndicator color={color.primary} /></View>

  const term = q.trim().toLowerCase()
  const clientes = (data ?? []).filter(
    (c) => !term || c.nombre.toLowerCase().includes(term) || (c.telefono ?? '').includes(term),
  )

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Clientes</Text>
        <TouchableOpacity style={s.addBtn} onPress={() => exigirSuscripcion(router) && router.push('/cliente/nuevo')} activeOpacity={0.9}>
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={s.body}>
        <AvisoSuscripcion />
        <View style={s.searchBox}>
          <Feather name="search" size={16} color={color.faint} />
          <TextInput
            style={s.search}
            value={q}
            onChangeText={setQ}
            placeholder="Buscar cliente…"
            placeholderTextColor={color.faint}
          />
        </View>
      </View>
      {clientes.length === 0 ? (
        <View style={s.empty}>
          <Feather name="users" size={44} color={color.faint} />
          <Text style={s.emptyTitle}>Sin clientes</Text>
          <Text style={s.emptySub}>Agrega tu primer cliente</Text>
        </View>
      ) : (
        <FlatList
          data={clientes}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 110 }}
          renderItem={({ item }) => {
            const c = tintePorScore(item.score)
            return (
              <TouchableOpacity style={s.card} onPress={() => router.push(`/cliente/${item.id}`)} activeOpacity={0.85}>
                <View style={[s.avatar, { backgroundColor: c.bg }]}>
                  <Text style={[s.avatarText, { color: c.fg }]}>{item.nombre.slice(0, 2).toUpperCase()}</Text>
                </View>
                <View style={s.info}>
                  <Text style={s.nombre}>{item.nombre}</Text>
                  {!!item.telefono && <Text style={s.tel}>{item.telefono}</Text>}
                </View>
                <View style={[s.score, { backgroundColor: c.bg }]}>
                  <Text style={[s.scoreText, { color: c.fg }]}>{item.score}</Text>
                </View>
              </TouchableOpacity>
            )
          }}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingTop: 56 },
  title: { fontFamily: font.display, fontSize: 24, color: color.ink, letterSpacing: -0.6 },
  addBtn: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: color.primary, alignItems: 'center', justifyContent: 'center', ...shadowRaised },
  body: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: color.surface, borderRadius: radius.md, paddingHorizontal: 14, ...shadowCard },
  search: { flex: 1, paddingVertical: 12, fontFamily: font.body, fontSize: 14, color: color.ink },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle: { fontFamily: font.displaySemi, fontSize: 18, color: color.ink, marginTop: 6 },
  emptySub: { fontFamily: font.body, fontSize: 13, color: color.muted },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: color.surface, borderRadius: radius.xl, padding: 13, marginBottom: 10, ...shadowCard },
  avatar: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: font.displaySemi, fontSize: 14 },
  info: { flex: 1 },
  nombre: { fontFamily: font.bodyBold, fontSize: 15, color: color.ink },
  tel: { fontFamily: font.body, fontSize: 12, color: color.muted, marginTop: 1 },
  score: { minWidth: 36, height: 28, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  scoreText: { fontFamily: font.bodyBold, fontSize: 12 },
})
