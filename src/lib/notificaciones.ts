import * as Notifications from 'expo-notifications'
import { supabase } from '@/lib/supabase'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
})

/**
 * Programa un recordatorio local diario para revisar los cobros del día.
 * (Notificación local — funciona en Expo Go. El push remoto requiere un dev build.)
 */
/**
 * Registra el token de push del dispositivo en el prestamista (para push remoto).
 * Requiere un dev build / EAS (projectId). En Expo Go falla silenciosamente.
 */
export async function registrarPush(prestamistaId: string): Promise<void> {
  try {
    const { status } = await Notifications.requestPermissionsAsync()
    if (status !== 'granted') return
    const token = (await Notifications.getExpoPushTokenAsync()).data
    if (token) await supabase.from('prestamistas').update({ push_token: token }).eq('id', prestamistaId)
  } catch {
    // Sin projectId (Expo Go) esto no aplica; se activa con el build nativo.
  }
}

export async function programarRecordatorioDiario(): Promise<void> {
  try {
    const { status } = await Notifications.requestPermissionsAsync()
    if (status !== 'granted') return
    await Notifications.cancelAllScheduledNotificationsAsync()
    await Notifications.scheduleNotificationAsync({
      content: { title: 'Préstalo', body: 'Revisa tus cobros de hoy 💰' },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 8,
        minute: 0,
      },
    })
  } catch {
    // sin permisos o entorno sin soporte: ignorar
  }
}
