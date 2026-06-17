import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { View, ActivityIndicator } from 'react-native'
import { getUsuarioActual } from '@/api/auth'
import { getPrestamista, getCartera, getCarterasAccesibles, registrarActividad } from '@/api/prestamistas'
import { tienePinLocal } from '@/lib/pin'
import { programarRecordatorioDiario } from '@/lib/notificaciones'
import { useSession } from '@/store/session'
import { COLORS } from '@/lib/constants'

export default function Index() {
  const router = useRouter()
  const { setPrestamista, setCarteraActiva, setMoneda, setDesbloqueado } = useSession()

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
        registrarActividad(prest.id).catch(() => {})
        programarRecordatorioDiario().catch(() => {})
        setCarteraActiva(prest.cartera_activa_id)
        if (prest.cartera_activa_id) {
          const cartera = await getCartera(prest.cartera_activa_id)
          if (cartera) setMoneda(cartera.moneda)
        }
        const tienePin = await tienePinLocal()
        router.replace(tienePin ? '/(auth)/lock' : '/(auth)/onboarding')
      } catch {
        router.replace('/(auth)/login')
      }
    })()
  }, [])

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary }}>
      <ActivityIndicator color={COLORS.gold} size="large" />
    </View>
  )
}
