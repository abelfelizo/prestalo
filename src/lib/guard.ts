import { useSuscripcion } from '@/store/suscripcion'

type Navegador = { push: (path: string) => void }

/**
 * Úsalo antes de cualquier acción de escritura (crear cliente/préstamo, registrar pago…).
 * - Si el usuario tiene acceso (prueba o suscripción) → devuelve true: ejecuta la acción.
 * - Si la prueba caducó y no pagó → lo envía al paywall y devuelve false: NO ejecutes nada.
 */
export function exigirSuscripcion(router: Navegador): boolean {
  if (useSuscripcion.getState().puedeEscribir()) return true
  router.push('/suscripcion')
  return false
}
