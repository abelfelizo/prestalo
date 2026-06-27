import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Share } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { getReporte } from '@/api/reportes'
import { getPrestamos } from '@/api/prestamos'
import { Boton } from '@/components/Boton'
import { useFmt } from '@/lib/useFmt'
import { useSession } from '@/store/session'
import { color as COLORS, font, radius, shadowCard, gradient } from '@/theme'
import { LinearGradient } from 'expo-linear-gradient'

export default function Reportes() {
  const router = useRouter()
  const f = useFmt()
  const carteraId = useSession((s) => s.carteraActivaId)

  const { data, isLoading } = useQuery({
    queryKey: ['reporte', carteraId],
    queryFn: () => getReporte(carteraId!),
    enabled: !!carteraId,
  })

  async function exportarCSV() {
    const prestamos = await getPrestamos(carteraId!)
    const head = 'Cliente,Capital,Saldo,Tasa,Modelo,Frecuencia,Cuotas,Pagadas,Estado'
    const filas = prestamos.map((p) =>
      [
        p.clientes?.nombre ?? '',
        p.monto_capital,
        p.saldo_pendiente,
        p.tasa_interes,
        p.modelo_interes,
        p.frecuencia_cobro,
        p.num_cuotas,
        p.cuotas_pagadas,
        p.estado,
      ].join(','),
    )
    const csv = [head, ...filas].join('\n')
    await Share.share({ message: csv, title: 'Reporte de préstamos' })
  }

  if (isLoading || !data) return <View style={s.center}><ActivityIndicator color={COLORS.primary} /></View>

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 20, paddingTop: 56 }}>
      <Text style={s.title}>Reportes</Text>

      <View style={s.hero}>
        <LinearGradient colors={gradient.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <Text style={s.heroLabel}>Capital en la calle</Text>
        <Text style={s.heroVal}>{f(data.capital_en_calle)}</Text>
      </View>

      <View style={s.grid}>
        <Met label="Total prestado" val={f(data.total_prestado)} />
        <Met label="Total cobrado" val={f(data.total_cobrado)} color={COLORS.success} />
        <Met label="Intereses generados" val={f(data.intereses_generados)} color={COLORS.cyan} />
        <Met label="Mora generada" val={f(data.mora_generada)} color={COLORS.danger} />
        <Met label="Clientes" val={String(data.clientes)} />
        <Met label="Préstamos activos" val={String(data.por_estado['activo'] ?? 0)} />
      </View>

      <Text style={s.section}>Por estado</Text>
      {Object.entries(data.por_estado).map(([estado, n]) => (
        <View key={estado} style={s.row}>
          <Text style={s.rowLabel}>{estado}</Text>
          <Text style={s.rowVal}>{n}</Text>
        </View>
      ))}

      <Boton icon="upload" label="Exportar CSV" onPress={exportarCSV} style={{ marginTop: 24 }} />
      <TouchableOpacity onPress={() => router.back()}><Text style={s.cancel}>Volver</Text></TouchableOpacity>
    </ScrollView>
  )
}

function Met({ label, val, color }: { label: string; val: string; color?: string }) {
  return (
    <View style={s.met}>
      <Text style={s.metLabel}>{label}</Text>
      <Text style={[s.metVal, color ? { color } : null]}>{val}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
  title: { fontFamily: font.display, fontSize: 24, color: COLORS.ink, letterSpacing: -0.6, marginBottom: 16 },
  hero: { borderRadius: radius.card, padding: 22, alignItems: 'center', marginBottom: 14, overflow: 'hidden' },
  heroLabel: { fontFamily: font.bodySemi, fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  heroVal: { fontFamily: font.display, fontSize: 30, color: '#fff', marginTop: 4, fontVariant: ['tabular-nums'] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  met: { flexBasis: '47%', flexGrow: 1, backgroundColor: COLORS.surface, borderRadius: radius.xl, padding: 14, ...shadowCard },
  metLabel: { fontFamily: font.bodySemi, fontSize: 11, color: COLORS.muted, marginBottom: 6 },
  metVal: { fontFamily: font.displaySemi, fontSize: 18, color: COLORS.ink, fontVariant: ['tabular-nums'] },
  section: { fontFamily: font.displaySemi, fontSize: 14, color: COLORS.ink, marginTop: 24, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.surface, borderRadius: radius.md, padding: 12, marginBottom: 6, ...shadowCard },
  rowLabel: { fontFamily: font.body, fontSize: 14, color: COLORS.ink, textTransform: 'capitalize' },
  rowVal: { fontFamily: font.bodyBold, fontSize: 14, color: COLORS.ink },
  cancel: { fontFamily: font.bodySemi, textAlign: 'center', color: COLORS.muted, marginTop: 16, fontSize: 14 },
})
