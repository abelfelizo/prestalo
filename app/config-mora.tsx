import { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { getConfigCartera, guardarConfigCartera } from '@/api/config'
import { queryClient } from '@/lib/queryClient'
import { Boton } from '@/components/Boton'
import { useSession } from '@/store/session'
import { color as COLORS, font, radius, shadowCard } from '@/theme'

const TIPOS = [
  { v: 'porcentaje_diario', label: '% diario' },
  { v: 'porcentaje_semanal', label: '% semanal' },
  { v: 'monto_fijo', label: 'Monto fijo' },
]
const SOBRE = [
  { v: 'saldo_pendiente', label: 'Saldo' },
  { v: 'monto_original', label: 'Capital' },
  { v: 'cuota', label: 'Cuota' },
]

export default function ConfigMora() {
  const router = useRouter()
  const carteraId = useSession((s) => s.carteraActivaId)

  const { data, isLoading } = useQuery({
    queryKey: ['config', carteraId],
    queryFn: () => getConfigCartera(carteraId!),
    enabled: !!carteraId,
  })

  const [aplica, setAplica] = useState(false)
  const [tipo, setTipo] = useState('porcentaje_diario')
  const [valor, setValor] = useState('')
  const [diasGracia, setDiasGracia] = useState('0')
  const [moraMax, setMoraMax] = useState('')
  const [sobre, setSobre] = useState('saldo_pendiente')
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    if (data) {
      setAplica(data.aplica_mora)
      setTipo(data.tipo_mora ?? 'porcentaje_diario')
      setValor(data.valor_mora != null ? String(data.valor_mora) : '')
      setDiasGracia(String(data.dias_gracia))
      setMoraMax(data.mora_maxima != null ? String(data.mora_maxima) : '')
      setSobre(data.aplica_mora_sobre)
      setMensaje(data.mensaje_mora_whatsapp ?? '')
    }
  }, [data])

  const mut = useMutation({
    mutationFn: () =>
      guardarConfigCartera({
        cartera_id: carteraId!,
        aplica_mora: aplica,
        tipo_mora: tipo,
        valor_mora: parseFloat(valor) || 0,
        dias_gracia: parseInt(diasGracia, 10) || 0,
        mora_maxima: moraMax ? parseFloat(moraMax) : null,
        aplica_mora_sobre: sobre,
        mensaje_mora_whatsapp: mensaje.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config', carteraId] })
      Alert.alert('Guardado', 'Configuración de mora actualizada')
      router.back()
    },
    onError: (e: any) => Alert.alert('Error', e.message ?? 'No se pudo guardar'),
  })

  if (isLoading) return <View style={s.center}><ActivityIndicator color={COLORS.primary} /></View>

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 20, paddingTop: 56 }}>
      <Text style={s.title}>Configuración de mora</Text>

      <View style={s.switchRow}>
        <Text style={s.switchLabel}>Aplicar mora</Text>
        <Switch value={aplica} onValueChange={setAplica} trackColor={{ true: COLORS.primary }} />
      </View>

      {aplica && (
        <>
          <Text style={s.label}>Tipo de mora</Text>
          <View style={s.chips}>
            {TIPOS.map((o) => (
              <TouchableOpacity key={o.v} style={[s.chip, tipo === o.v && s.chipSel]} onPress={() => setTipo(o.v)}>
                <Text style={[s.chipText, tipo === o.v && s.chipTextSel]}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Valor ({tipo === 'monto_fijo' ? 'monto' : '%'})</Text>
          <TextInput style={s.input} value={valor} onChangeText={setValor} placeholder="0" placeholderTextColor="#bbb" keyboardType="numeric" />

          <Text style={s.label}>Días de gracia</Text>
          <TextInput style={s.input} value={diasGracia} onChangeText={setDiasGracia} placeholder="0" placeholderTextColor="#bbb" keyboardType="numeric" />

          <Text style={s.label}>Mora máxima (opcional)</Text>
          <TextInput style={s.input} value={moraMax} onChangeText={setMoraMax} placeholder="Sin tope" placeholderTextColor="#bbb" keyboardType="numeric" />

          <Text style={s.label}>Aplicar sobre</Text>
          <View style={s.chips}>
            {SOBRE.map((o) => (
              <TouchableOpacity key={o.v} style={[s.chip, sobre === o.v && s.chipSel]} onPress={() => setSobre(o.v)}>
                <Text style={[s.chipText, sobre === o.v && s.chipTextSel]}>{o.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Mensaje de WhatsApp (opcional)</Text>
          <TextInput style={[s.input, { height: 80 }]} value={mensaje} onChangeText={setMensaje} placeholder="Recordatorio de pago..." placeholderTextColor="#bbb" multiline />
        </>
      )}

      <Boton icon="check" label="Guardar" loading={mut.isPending} onPress={() => mut.mutate()} style={{ marginTop: 28 }} />
      <TouchableOpacity onPress={() => router.back()}><Text style={s.cancel}>Cancelar</Text></TouchableOpacity>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
  title: { fontFamily: font.display, fontSize: 24, color: COLORS.ink, letterSpacing: -0.6, marginBottom: 8 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, backgroundColor: COLORS.surface, borderRadius: radius.md, padding: 14, ...shadowCard },
  switchLabel: { fontFamily: font.bodyBold, fontSize: 15, color: COLORS.ink },
  label: { fontFamily: font.bodyBold, fontSize: 11, color: COLORS.faint, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: COLORS.surface, borderRadius: radius.md, padding: 14, fontFamily: font.body, fontSize: 15, color: COLORS.ink, ...shadowCard },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.md, backgroundColor: COLORS.surface, ...shadowCard },
  chipSel: { backgroundColor: COLORS.primary },
  chipText: { fontFamily: font.bodySemi, fontSize: 13, color: COLORS.ink },
  chipTextSel: { color: '#fff' },
  cancel: { fontFamily: font.bodySemi, textAlign: 'center', color: COLORS.muted, marginTop: 16, fontSize: 14 },
})
