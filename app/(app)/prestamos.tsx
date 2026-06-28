import { useState } from 'react'
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { getPrestamos } from '@/api/prestamos'
import { useFmt } from '@/lib/useFmt'
import { useSession } from '@/store/session'
import { exigirSuscripcion } from '@/lib/guard'
import { AvisoSuscripcion } from '@/components/AvisoSuscripcion'
import { color, font, radius, shadowCard, shadowRaised, gradient } from '@/theme'

function estadoTinte(estado: string) {
  if (estado === 'en_mora') return { bg: color.dangerTint, fg: color.danger, label: 'Mora' }
  if (estado === 'activo') return { bg: color.successTint, fg: color.success, label: 'Al día' }
  return { bg: color.indigoTint, fg: color.primary, label: estado }
}

export default function Prestamos() {
  const router = useRouter()
  const f = useFmt()
  const carteraId = useSession((s) => s.carteraActivaId)
  const esColaborador = useSession((s) => s.esColaborador)
  const permisos = useSession((s) => s.permisos)
  const puedeCrear = !esColaborador || !!permisos.prestamos
  const [q, setQ] = useState('')
  const { data, isLoading } = useQuery({
    queryKey: ['prestamos', carteraId],
    queryFn: () => getPrestamos(carteraId!),
    enabled: !!carteraId,
  })

  if (isLoading) return <View style={s.center}><ActivityIndicator color={color.primary} /></View>

  const term = q.trim().toLowerCase()
  const prestamos = (data ?? []).filter(
    (p) => !term || (p.clientes?.nombre ?? '').toLowerCase().includes(term),
  )

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Préstamos</Text>
        {puedeCrear && (
          <TouchableOpacity style={s.addBtn} accessibilityLabel="Agregar préstamo" accessibilityRole="button" onPress={() => exigirSuscripcion(router) && router.push('/prestamo/nuevo')} activeOpacity={0.9}>
            <Feather name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
      <View style={s.body}>
        <AvisoSuscripcion />
        <View style={s.searchBox}>
          <Feather name="search" size={16} color={color.faint} />
          <TextInput style={s.search} value={q} onChangeText={setQ} placeholder="Buscar por cliente…" placeholderTextColor={color.faint} />
        </View>
      </View>
      {prestamos.length === 0 ? (
        <View style={s.empty}>
          <Feather name="credit-card" size={44} color={color.faint} />
          <Text style={s.emptyTitle}>Sin préstamos</Text>
          <Text style={s.emptySub}>Los préstamos aparecerán aquí</Text>
        </View>
      ) : (
        <FlatList
          data={prestamos}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 110 }}
          renderItem={({ item }) => {
            const c = estadoTinte(item.estado)
            const pct = item.num_cuotas ? Math.min(1, item.cuotas_pagadas / item.num_cuotas) : 0
            const mora = item.estado === 'en_mora'
            return (
              <TouchableOpacity style={s.card} onPress={() => router.push(`/prestamo/${item.id}`)} activeOpacity={0.85}>
                <View style={s.cardTop}>
                  <View style={s.cardLeft}>
                    <View style={[s.avatar, { backgroundColor: c.bg }]}>
                      <Text style={[s.avatarText, { color: c.fg }]}>{(item.clientes?.nombre || 'XX').slice(0, 2).toUpperCase()}</Text>
                    </View>
                    <View>
                      <Text style={s.clienteNombre}>{item.clientes?.nombre || 'Cliente'}</Text>
                      <Text style={s.sub}>Saldo {f(item.saldo_pendiente)}</Text>
                    </View>
                  </View>
                  <View style={[s.pill, { backgroundColor: c.bg }]}>
                    <View style={[s.dot, { backgroundColor: c.fg }]} />
                    <Text style={[s.pillText, { color: c.fg }]}>{c.label}</Text>
                  </View>
                </View>

                <View style={s.track}>
                  {mora ? (
                    <View style={[s.fill, { width: `${pct * 100}%`, backgroundColor: color.danger }]} />
                  ) : (
                    <LinearGradient colors={gradient.button} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[s.fill, { width: `${pct * 100}%` }]} />
                  )}
                </View>
                <View style={s.footer}>
                  <Text style={s.footMeta}>Cuota {item.cuotas_pagadas}/{item.num_cuotas}</Text>
                  <Text style={s.footMeta}>Capital {f(item.monto_capital)}</Text>
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
  card: { backgroundColor: color.surface, borderRadius: radius.xl, padding: 14, marginBottom: 10, ...shadowCard },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  avatar: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: font.displaySemi, fontSize: 14 },
  clienteNombre: { fontFamily: font.bodyBold, fontSize: 15, color: color.ink },
  sub: { fontFamily: font.body, fontSize: 12, color: color.muted, marginTop: 2 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.sm },
  dot: { width: 5, height: 5, borderRadius: 3 },
  pillText: { fontFamily: font.bodyBold, fontSize: 10 },
  track: { height: 6, borderRadius: 4, backgroundColor: color.indigoTint, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  footMeta: { fontFamily: font.bodySemi, fontSize: 12, color: color.muted },
})
