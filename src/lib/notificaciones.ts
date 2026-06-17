import * as Notifications from 'expo-notifications'

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
