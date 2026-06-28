import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { View, ActivityIndicator } from 'react-native'
import { getUsuarioActual } from '@/api/auth'
import { getPrestamista, getCartera, getCarterasAccesibles, registrarActividad, getMisPermisos } from '@/api/prestamistas'
import { programarRecordatorioDiario, registrarPush } from '@/lib/notificaciones'
import { initIAP, sincronizarSuscripcion } from '@/lib/iap'
import { useSession } from '@/store/session'
import { useSuscripcion } from '@/store/suscripcion'
import { color as COLORS } from '@/theme'

export default function Index() {
  const router = useRouter()
  const { setPrestamista, setCarteraActiva, setMoneda, setDesbloqueado, setEsColaborador, setPermisos } = useSession()

  useEffect(() => {
    ;(async () => {
      try {
        const user = await getUsuarioActual()
        if (!user) {
          router.replace('/(auth)/login')
          return
        }
        const prest = await getPrestamista(user.id)
        if (!prest) {
          // ¿Es un cobrador con carteras compartidas? Entra directo.
          const compartidas = await getCarterasAccesibles().catch(() => [])
          if (compartidas.length > 0) {
            // Los cobradores acceden a través de la cartera del dueño: acceso completo.
            // DECISIÓN DE PRODUCTO (intencional): el colaborador NO pasa por PIN local.
            // Entra con desbloqueado=true. El PIN para colaboradores queda como mejora futura.
            useSuscripcion.getState().set('activa', 0)
            setEsColaborador(true)
            setPermisos(await getMisPermisos(compartidas[0].id).catch(() => ({})))
            setCarteraActiva(compartidas[0].id)
            setMoneda(compartidas[0].moneda)
            setDesbloqueado(true)
            router.replace('/(app)/dashboard')
            return
          }
          router.replace('/(auth)/onboarding')
          return
        }
        setPrestamista(prest.id)
        setEsColaborador(false)
        setPermisos({ dueno: true, pagos: true, clientes: true, prestamos: true, caja: true })
        await initIAP(prest.id)
        sincronizarSuscripcion(prest.created_at).catch(() => {})
        registrarActividad(prest.id).catch(() => {})
        programarRecordatorioDiario().catch(() => {})
        registrarPush(prest.id).catch(() => {})
        setCarteraActiva(prest.cartera_activa_id)
        if (prest.cartera_activa_id) {
          const cartera = await getCartera(prest.cartera_activa_id)
          if (cartera) setMoneda(cartera.moneda)
        }
        // La pantalla de bloqueo crea el PIN si no existe (p.ej. tras cerrar sesión)
        router.replace('/(auth)/lock')
      } catch {
        router.replace('/(auth)/login')
      }
    })()
  }, [])

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primaryDeep }}>
      <ActivityIndicator color={COLORS.cyanLight} size="large" />
    </View>
  )
}
