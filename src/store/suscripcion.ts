import { create } from 'zustand'

/**
 * Estado de acceso del prestamista:
 * - 'cargando'  : aún no se ha resuelto (al arrancar)
 * - 'prueba'    : dentro de los 30 días de prueba gratis (acceso total)
 * - 'activa'    : suscripción de pago activa (acceso total)
 * - 'expirada'  : se acabó la prueba y no hay suscripción → SOLO LECTURA
 */
export type EstadoSuscripcion = 'cargando' | 'prueba' | 'activa' | 'expirada'

export const DIAS_PRUEBA = 30

interface SuscripcionState {
  estado: EstadoSuscripcion
  diasRestantes: number // días que quedan de prueba (0 si no aplica)
  set: (estado: EstadoSuscripcion, diasRestantes?: number) => void
  /** true si el usuario puede crear/editar/cobrar (prueba o suscripción activa). */
  puedeEscribir: () => boolean
}

export const useSuscripcion = create<SuscripcionState>((set, get) => ({
  estado: 'cargando',
  diasRestantes: 0,
  set: (estado, diasRestantes = 0) => set({ estado, diasRestantes }),
  puedeEscribir: () => {
    const e = get().estado
    return e === 'prueba' || e === 'activa'
  },
}))
