import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native'
import { errMsg } from '@/lib/errores'
import { useRouter } from 'expo-router'
import { accesoHeredero, type AccesoHeredero } from '@/api/herederos'
import { hashPin } from '@/lib/pin'
import { cobrarPorWhatsApp } from '@/lib/whatsapp'
import { color as COLORS, font } from '@/theme'

export default function HerederoAcceso() {
  const router = useRouter()
  const [telefono, setTelefono] = useState('')
  const [clave, setClave] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<AccesoHeredero | null>(null)

  async function consultar() {
    if (!telefono.trim() || !clave.trim()) return Alert.alert('Completa teléfono y clave')
    setLoading(true)
    try {
      const r = await accesoHeredero(telefono.trim(), await hashPin(clave))
      if (!r) {
        Alert.alert('No encontrado', 'Teléfono o clave incorrectos.')
        return
      }
      setResultado(r)
    } catch (e: any) {
      Alert.alert('Error', errMsg(e, 'No se pudo consultar'))
    } finally {
      setLoading(false)
    }
  }

  const fmt = (n: number) => `RD$ ${Number(n || 0).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 24, paddingTop: 64 }}>
      <Text style={s.title}>Acceso de heredero</Text>
      <Text style={s.sub}>Solo disponible si el prestamista lleva inactivo los días configurados.</Text>

      {!resultado?.autorizado && (
        <>
          <Text style={s.label}>Tu teléfono</Text>
          <TextInput style={s.input} value={telefono} onChangeText={setTelefono} placeholder="809..." placeholderTextColor="#888" keyboardType="phone-pad" />
          <Text style={s.label}>Tu clave</Text>
          <TextInput style={s.input} value={clave} onChangeText={setClave} placeholder="Clave" placeholderTextColor="#888" secureTextEntry />

          <TouchableOpacity style={s.btn} onPress={consultar} disabled={loading}>
            {loading ? <ActivityIndicator color={COLORS.primary} /> : <Text style={s.btnText}>Consultar</Text>}
          </TouchableOpacity>
        </>
      )}

      {resultado && !resultado.autorizado && (
        <View style={s.warn}>
          <Text style={s.warnText}>
            El prestamista sigue activo. Faltan {Math.max((resultado.dias_requeridos ?? 0) - (resultado.dias_inactivo ?? 0), 0)} días
            de inactividad para habilitar el acceso.
          </Text>
        </View>
      )}

      {resultado?.autorizado && (
        <>
          <View style={s.hero}>
            <Text style={s.heroLabel}>Cartera de {resultado.prestamista}</Text>
            <Text style={s.heroVal}>{fmt(resultado.capital_en_calle ?? 0)}</Text>
            <Text style={s.heroSub}>capital en la calle · {resultado.dias_inactivo} días inactivo</Text>
          </View>
          <Text style={s.section}>Clientes con saldo</Text>
          {(resultado.clientes ?? []).map((c, i) => (
            <View key={i} style={s.card}>
              <View style={{ flex: 1 }}>
                <Text style={s.cardName}>{c.nombre}</Text>
                <Text style={s.cardSub}>{c.telefono} · {fmt(c.saldo)}</Text>
              </View>
              {!!c.telefono && (
                <TouchableOpacity onPress={() => cobrarPorWhatsApp(c.telefono, c.nombre, c.saldo, 'RD$')}>
                  <Text style={s.wa}>💬</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </>
      )}

      <TouchableOpacity onPress={() => router.back()}><Text style={s.cancel}>Volver</Text></TouchableOpacity>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primaryDeep },
  title: { fontFamily: font.display, fontSize: 26, color: COLORS.cyanLight, letterSpacing: -0.6 },
  sub: { fontFamily: font.body, fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 6, marginBottom: 10, lineHeight: 19 },
  label: { fontFamily: font.bodyBold, fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: 14, fontFamily: font.body, fontSize: 15, color: '#fff', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.22)' },
  btn: { backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 24 },
  btnText: { fontFamily: font.bodyBold, fontSize: 15, color: COLORS.primary },
  warn: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 16, marginTop: 20 },
  warnText: { fontFamily: font.body, color: '#fff', fontSize: 14, lineHeight: 20 },
  hero: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 22, padding: 22, alignItems: 'center', marginTop: 10 },
  heroLabel: { fontFamily: font.bodySemi, fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  heroVal: { fontFamily: font.display, fontSize: 28, color: COLORS.cyanLight, marginTop: 4 },
  heroSub: { fontFamily: font.body, fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 6 },
  section: { fontFamily: font.bodyBold, fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 24, marginBottom: 10 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 16, padding: 14, marginBottom: 8 },
  cardName: { fontFamily: font.bodyBold, fontSize: 15, color: '#fff' },
  cardSub: { fontFamily: font.body, fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  wa: { fontSize: 22 },
  cancel: { fontFamily: font.bodySemi, textAlign: 'center', color: 'rgba(255,255,255,0.5)', marginTop: 24, fontSize: 14 },
})
