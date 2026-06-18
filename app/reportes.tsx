import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Share } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { getReporte } from '@/api/reportes'
import { getPrestamos } from '@/api/prestamos'
import { Boton } from '@/components/Boton'
import { useFmt } from '@/lib/useFmt'
import { useSession } from '@/store/session'
import { COLORS } from '@/lib/constants'

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
        <Text style={s.heroLabel}>Capital en la calle</Text>
        <Text style={s.heroVal}>{f(data.capital_en_calle)}</Text>
      </View>

      <View style={s.grid}>
        <Met label="Total prestado" val={f(data.total_prestado)} />
        <Met label="Total cobrado" val={f(data.total_cobrado)} color={COLORS.success} />
        <Met label="Intereses generados" val={f(data.intereses_generados)} color={COLORS.gold} />
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
  title: { fontSize: 26, fontWeight: '800', color: COLORS.primary, marginBottom: 16 },
  hero: { backgroundColor: COLORS.primary, borderRadius: 18, padding: 22, alignItems: 'center', marginBottom: 14 },
  heroLabel: { fontSize: 12, color: 'rgba(255,255,255,0.5)' },
  heroVal: { fontSize: 30, fontWeight: '800', color: COLORS.gold, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  met: { flexBasis: '47%', flexGrow: 1, backgroundColor: COLORS.surface, borderRadius: 14, padding: 14 },
  metLabel: { fontSize: 11, color: COLORS.textLight, marginBottom: 6 },
  metVal: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  section: { fontSize: 11, fontWeight: '700', color: '#ccc', textTransform: 'uppercase', letterSpacing: 1, marginTop: 24, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.surface, borderRadius: 10, padding: 12, marginBottom: 6 },
  rowLabel: { fontSize: 14, color: COLORS.text, textTransform: 'capitalize' },
  rowVal: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  btn: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24 },
  btnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  cancel: { textAlign: 'center', color: COLORS.textLight, marginTop: 16, fontSize: 14 },
})
