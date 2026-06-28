import { useEffect, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Switch, ActivityIndicator, Linking, Platform } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { getPrestamista, editarPerfil } from '@/api/prestamistas'
import { actualizarEmail, actualizarPassword, getUsuarioActual } from '@/api/auth'
import {
  verificarPinLocal,
  guardarPinLocal,
  biometriaActiva,
  setBiometriaActiva,
  biometriaDisponible,
} from '@/lib/pin'
import { errMsg } from '@/lib/errores'
import { queryClient } from '@/lib/queryClient'
import { useSession } from '@/store/session'
import { usePinPrompt } from '@/store/pinPrompt'
import { color, font, radius, shadowCard } from '@/theme'

export default function Cuenta() {
  const router = useRouter()
  const prestamistaId = useSession((s) => s.prestamistaId)
  const pedirPin = usePinPrompt((s) => s.pedirPin)

  const prestamista = useQuery({
    queryKey: ['prestamista', prestamistaId],
    queryFn: () => getPrestamista(prestamistaId!),
    enabled: !!prestamistaId,
  })

  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [bio, setBio] = useState(true)
  const [bioSoportada, setBioSoportada] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const largoPin = prestamista.data?.metodo_seguridad === 'pin_6' ? 6 : 4

  useEffect(() => {
    if (prestamista.data) {
      setNombre(prestamista.data.nombre ?? '')
      setTelefono(prestamista.data.telefono ?? '')
    }
  }, [prestamista.data])

  useEffect(() => {
    ;(async () => {
      const u = await getUsuarioActual()
      setEmail(u?.email ?? '')
      setBio(await biometriaActiva())
      setBioSoportada(await biometriaDisponible())
    })()
  }, [])

  async function guardarPerfil() {
    if (!nombre.trim()) return Alert.alert('Falta tu nombre')
    setGuardando(true)
    try {
      await editarPerfil(prestamistaId!, { nombre: nombre.trim(), telefono: telefono.trim() || null })
      queryClient.invalidateQueries({ queryKey: ['prestamista', prestamistaId] })
      Alert.alert('Listo', 'Perfil actualizado')
    } catch (e: any) {
      Alert.alert('Error', errMsg(e, 'No se pudo guardar el perfil'))
    } finally {
      setGuardando(false)
    }
  }

  const [emailNuevo, setEmailNuevo] = useState('')
  const [editandoCorreo, setEditandoCorreo] = useState(false)

  async function guardarCorreo() {
    if (!emailNuevo.trim()) return Alert.alert('Escribe el nuevo correo')
    try {
      await actualizarEmail(emailNuevo)
      setEmailNuevo('')
      setEditandoCorreo(false)
      Alert.alert('Revisa tu correo', 'Confirma el cambio desde el enlace que te enviamos al nuevo correo.')
    } catch (e: any) {
      Alert.alert('Error', errMsg(e, 'No se pudo cambiar el correo'))
    }
  }

  function cambiarContrasena() {
    if (passwordNueva.length < 8) return Alert.alert('Contraseña corta', 'Mínimo 8 caracteres')
    if (passwordNueva !== passwordConfirmar) return Alert.alert('No coinciden', 'Las contraseñas no coinciden')
    pedirPin(async () => {
      try {
        await actualizarPassword(passwordNueva)
        setPasswordNueva('')
        setPasswordConfirmar('')
        Alert.alert('Listo', 'Contraseña actualizada')
      } catch (e: any) {
        Alert.alert('Error', errMsg(e, 'No se pudo cambiar la contraseña'))
      }
    }, 'PIN para cambiar la contraseña')
  }

  const [passwordNueva, setPasswordNueva] = useState('')
  const [passwordConfirmar, setPasswordConfirmar] = useState('')
  const [pinActual, setPinActual] = useState('')
  const [pinNuevo, setPinNuevo] = useState('')
  const [pinConfirmar, setPinConfirmar] = useState('')

  async function cambiarPin() {
    if (pinNuevo.length !== largoPin) return Alert.alert('PIN inválido', `El PIN debe tener ${largoPin} dígitos`)
    if (pinNuevo !== pinConfirmar) return Alert.alert('No coinciden', 'Los PIN no coinciden')
    if (!(await verificarPinLocal(pinActual))) return Alert.alert('PIN actual incorrecto')
    try {
      await guardarPinLocal(pinNuevo)
      setPinActual(''); setPinNuevo(''); setPinConfirmar('')
      Alert.alert('Listo', 'PIN actualizado')
    } catch (e: any) {
      Alert.alert('Error', errMsg(e, 'No se pudo cambiar el PIN'))
    }
  }

  async function toggleBio(v: boolean) {
    setBio(v)
    await setBiometriaActiva(v)
  }

  function gestionarSuscripcion() {
    const url = Platform.OS === 'ios'
      ? 'https://apps.apple.com/account/subscriptions'
      : 'https://play.google.com/store/account/subscriptions'
    Linking.openURL(url).catch(() => {})
  }

  if (prestamista.isLoading) return <View style={s.center}><ActivityIndicator color={color.primary} /></View>

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 60 }}>
      <TouchableOpacity style={s.back} onPress={() => router.back()}>
        <Feather name="chevron-left" size={20} color={color.ink} />
      </TouchableOpacity>
      <Text style={s.title}>Cuenta y seguridad</Text>

      <Text style={s.section}>Perfil</Text>
      <Text style={s.label}>Nombre</Text>
      <TextInput style={s.input} value={nombre} onChangeText={setNombre} placeholder="Tu nombre" placeholderTextColor={color.faint} />
      <Text style={s.label}>Teléfono</Text>
      <TextInput style={s.input} value={telefono} onChangeText={setTelefono} placeholder="809..." placeholderTextColor={color.faint} keyboardType="phone-pad" />
      <TouchableOpacity style={s.btn} onPress={guardarPerfil} disabled={guardando} activeOpacity={0.9}>
        {guardando ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Guardar perfil</Text>}
      </TouchableOpacity>

      <Text style={s.section}>Correo</Text>
      <Text style={s.valor}>{email || '—'}</Text>
      {editandoCorreo ? (
        <>
          <TextInput style={[s.input, { marginTop: 10 }]} value={emailNuevo} onChangeText={setEmailNuevo} placeholder="nuevo@correo.com" placeholderTextColor={color.faint} autoCapitalize="none" keyboardType="email-address" />
          <TouchableOpacity style={s.btnGhost} onPress={guardarCorreo} activeOpacity={0.8}>
            <Text style={s.btnGhostText}>Enviar verificación</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity style={s.btnGhost} onPress={() => setEditandoCorreo(true)} activeOpacity={0.8}>
          <Text style={s.btnGhostText}>Cambiar correo</Text>
        </TouchableOpacity>
      )}

      <Text style={s.section}>Contraseña</Text>
      <Text style={s.label}>Nueva contraseña</Text>
      <TextInput style={s.input} value={passwordNueva} onChangeText={setPasswordNueva} placeholder="Mínimo 8 caracteres" placeholderTextColor={color.faint} secureTextEntry />
      <Text style={s.label}>Confirmar</Text>
      <TextInput style={s.input} value={passwordConfirmar} onChangeText={setPasswordConfirmar} placeholder="Repite la contraseña" placeholderTextColor={color.faint} secureTextEntry />
      <TouchableOpacity style={s.btnGhost} onPress={cambiarContrasena} activeOpacity={0.8}>
        <Text style={s.btnGhostText}>Cambiar contraseña</Text>
      </TouchableOpacity>

      <Text style={s.section}>PIN ({largoPin} dígitos)</Text>
      <Text style={s.label}>PIN actual</Text>
      <TextInput style={s.input} value={pinActual} onChangeText={(t) => setPinActual(t.replace(/\D/g, '').slice(0, largoPin))} keyboardType="number-pad" secureTextEntry maxLength={largoPin} placeholder="••••" placeholderTextColor={color.faint} />
      <Text style={s.label}>PIN nuevo</Text>
      <TextInput style={s.input} value={pinNuevo} onChangeText={(t) => setPinNuevo(t.replace(/\D/g, '').slice(0, largoPin))} keyboardType="number-pad" secureTextEntry maxLength={largoPin} placeholder="••••" placeholderTextColor={color.faint} />
      <Text style={s.label}>Confirmar PIN</Text>
      <TextInput style={s.input} value={pinConfirmar} onChangeText={(t) => setPinConfirmar(t.replace(/\D/g, '').slice(0, largoPin))} keyboardType="number-pad" secureTextEntry maxLength={largoPin} placeholder="••••" placeholderTextColor={color.faint} />
      <TouchableOpacity style={s.btnGhost} onPress={cambiarPin} activeOpacity={0.8}>
        <Text style={s.btnGhostText}>Cambiar PIN</Text>
      </TouchableOpacity>

      {bioSoportada && (
        <>
          <Text style={s.section}>Biometría</Text>
          <View style={s.switchRow}>
            <Text style={s.switchLabel}>Desbloquear con huella / Face ID</Text>
            <Switch value={bio} onValueChange={toggleBio} trackColor={{ true: color.primary }} />
          </View>
        </>
      )}

      <Text style={s.section}>Suscripción</Text>
      <TouchableOpacity style={s.btnGhost} onPress={gestionarSuscripcion} activeOpacity={0.8}>
        <Text style={s.btnGhostText}>Gestionar suscripción</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: color.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: color.bg },
  back: { width: 38, height: 38, borderRadius: radius.md, backgroundColor: color.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 12, ...shadowCard },
  title: { fontFamily: font.display, fontSize: 24, color: color.ink, letterSpacing: -0.6, marginBottom: 8 },
  section: { fontFamily: font.bodyBold, fontSize: 11, color: color.faint, textTransform: 'uppercase', letterSpacing: 1, marginTop: 24, marginBottom: 10 },
  label: { fontFamily: font.bodySemi, fontSize: 12, color: color.muted, marginBottom: 6, marginTop: 8 },
  valor: { fontFamily: font.bodyBold, fontSize: 15, color: color.ink },
  input: { backgroundColor: color.surface, borderRadius: radius.md, padding: 14, fontFamily: font.body, fontSize: 15, color: color.ink, ...shadowCard },
  btn: { backgroundColor: color.primary, borderRadius: radius.md, padding: 15, alignItems: 'center', marginTop: 14 },
  btnText: { fontFamily: font.bodyBold, color: '#fff', fontSize: 15 },
  btnGhost: { backgroundColor: color.surface, borderRadius: radius.md, padding: 14, alignItems: 'center', marginTop: 10, ...shadowCard },
  btnGhostText: { fontFamily: font.bodyBold, color: color.ink, fontSize: 14 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: color.surface, borderRadius: radius.md, padding: 14, ...shadowCard },
  switchLabel: { fontFamily: font.bodySemi, fontSize: 14, color: color.ink, flex: 1 },
})
