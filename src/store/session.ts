import { create } from 'zustand'

/** Permisos del usuario sobre la cartera activa (el dueño los tiene todos). */
export interface Permisos {
  dueno?: boolean
  pagos?: boolean
  clientes?: boolean
  prestamos?: boolean
  caja?: boolean
}

interface SessionState {
  prestamistaId: string | null
  carteraActivaId: string | null
  moneda: string
  desbloqueado: boolean // PIN/biometría superado en esta sesión de app
  esColaborador: boolean // true si entró como cobrador a una cartera compartida (no dueño)
  permisos: Permisos // permisos sobre la cartera activa
  setPrestamista: (id: string | null) => void
  setCarteraActiva: (id: string | null) => void
  setMoneda: (m: string) => void
  setDesbloqueado: (v: boolean) => void
  setEsColaborador: (v: boolean) => void
  setPermisos: (p: Permisos) => void
  /** ¿Puede el usuario hacer esta acción en la cartera activa? El dueño siempre puede. */
  puede: (accion: keyof Permisos) => boolean
  reset: () => void
}

export const useSession = create<SessionState>((set, get) => ({
  prestamistaId: null,
  carteraActivaId: null,
  moneda: 'RD$',
  desbloqueado: false,
  esColaborador: false,
  permisos: {},
  setPrestamista: (id) => set({ prestamistaId: id }),
  setCarteraActiva: (id) => set({ carteraActivaId: id }),
  setMoneda: (m) => set({ moneda: m }),
  setDesbloqueado: (v) => set({ desbloqueado: v }),
  setEsColaborador: (v) => set({ esColaborador: v }),
  setPermisos: (p) => set({ permisos: p ?? {} }),
  puede: (accion) => {
    const { esColaborador, permisos } = get()
    return !esColaborador || !!permisos[accion]
  },
  reset: () => set({ prestamistaId: null, carteraActivaId: null, moneda: 'RD$', desbloqueado: false, esColaborador: false, permisos: {} }),
}))
