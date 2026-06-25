import { Platform } from 'react-native'
import { DIAS_PRUEBA, useSuscripcion } from '@/store/suscripcion'

/**
 * Capa de compras in-app sobre RevenueCat (StoreKit en iOS, Play Billing en Android).
 * El MISMO código sirve para ambas tiendas: solo cambia la API key por plataforma.
 *
 * Modelo de negocio:
 *  - Prueba gratis de 30 días anclada a `prestamistas.created_at` (servidor, no se resetea
 *    al reinstalar).
 *  - Al caducar la prueba sin suscripción de pago → modo SOLO LECTURA.
 *  - Un único producto de pago: `kuotas_pro_mensual` (US$9.99/mes), entitlement "pro".
 *
 * Requiere un build nativo (EAS/dev build). En Expo Go o en tests el módulo nativo no existe;
 * en ese caso degradamos con elegancia (no crashea) y la prueba por fecha sigue funcionando.
 */

const ENTITLEMENT = 'pro'

const RC_API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_RC_IOS_KEY,
  android: process.env.EXPO_PUBLIC_RC_ANDROID_KEY,
})

// Carga perezosa del SDK nativo: evita romper donde no está disponible.
function getPurchases(): typeof import('react-native-purchases').default | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('react-native-purchases').default
  } catch {
    return null
  }
}

let configurado = false

/** Inicializa RevenueCat una sola vez. Seguro de llamar siempre. */
export async function initIAP(appUserId?: string): Promise<void> {
  if (configurado || !RC_API_KEY) return
  const Purchases = getPurchases()
  if (!Purchases) return
  try {
    Purchases.configure({ apiKey: RC_API_KEY, appUserID: appUserId })
    configurado = true
  } catch {
    /* sin red / sin nativo: la prueba por fecha cubre el acceso */
  }
}

/** ¿El usuario tiene la suscripción de pago "pro" activa en la tienda? */
async function tieneSuscripcionActiva(): Promise<boolean> {
  const Purchases = getPurchases()
  if (!Purchases || !configurado) return false
  try {
    const info = await Purchases.getCustomerInfo()
    return info.entitlements.active[ENTITLEMENT] !== undefined
  } catch {
    return false
  }
}

function diasRestantesPrueba(createdAt: string | null): number {
  if (!createdAt) return DIAS_PRUEBA // sin fecha conocida → conceder la prueba completa
  const inicio = new Date(createdAt).getTime()
  const dias = Math.floor((Date.now() - inicio) / 86_400_000)
  return Math.max(0, DIAS_PRUEBA - dias)
}

/**
 * Resuelve el estado de acceso y lo guarda en el store.
 * Acceso total = suscripción de pago activa O dentro de los 30 días de prueba.
 */
export async function sincronizarSuscripcion(createdAt: string | null): Promise<void> {
  const set = useSuscripcion.getState().set
  if (await tieneSuscripcionActiva()) {
    set('activa', 0)
    return
  }
  const dias = diasRestantesPrueba(createdAt)
  if (dias > 0) set('prueba', dias)
  else set('expirada', 0)
}

/** Lanza la compra del paquete actual. Devuelve true si quedó suscrito. */
export async function comprarSuscripcion(): Promise<boolean> {
  const Purchases = getPurchases()
  if (!Purchases || !configurado) throw new Error('Compras no disponibles en esta versión de la app.')
  const offerings = await Purchases.getOfferings()
  const paquete = offerings.current?.availablePackages?.[0]
  if (!paquete) throw new Error('No hay planes disponibles en este momento.')
  const { customerInfo } = await Purchases.purchasePackage(paquete)
  const activa = customerInfo.entitlements.active[ENTITLEMENT] !== undefined
  if (activa) useSuscripcion.getState().set('activa', 0)
  return activa
}

/** Restaura compras previas (cambio de teléfono, reinstalación). */
export async function restaurarCompras(): Promise<boolean> {
  const Purchases = getPurchases()
  if (!Purchases || !configurado) return false
  const info = await Purchases.restorePurchases()
  const activa = info.entitlements.active[ENTITLEMENT] !== undefined
  if (activa) useSuscripcion.getState().set('activa', 0)
  return activa
}

/** Precio localizado del plan para mostrar en el paywall (con fallback). */
export async function getPrecioPlan(): Promise<string> {
  const Purchases = getPurchases()
  if (!Purchases || !configurado) return 'US$9.99/mes'
  try {
    const offerings = await Purchases.getOfferings()
    const p = offerings.current?.availablePackages?.[0]?.product
    return p ? `${p.priceString}/mes` : 'US$9.99/mes'
  } catch {
    return 'US$9.99/mes'
  }
}
