import { create } from 'zustand'

interface SessionState {
  prestamistaId: string | null
  carteraActivaId: string | null
  moneda: string
  desbloqueado: boolean // PIN/biometría superado en esta sesión de app
  setPrestamista: (id: string | null) => void
  setCarteraActiva: (id: string | null) => void
  setMoneda: (m: string) => void
  setDesbloqueado: (v: boolean) => void
  reset: () => void
}

export const useSession = create<SessionState>((set) => ({
  prestamistaId: null,
  carteraActivaId: null,
  moneda: 'RD$',
  desbloqueado: false,
  setPrestamista: (id) => set({ prestamistaId: id }),
  setCarteraActiva: (id) => set({ carteraActivaId: id }),
  setMoneda: (m) => set({ moneda: m }),
  setDesbloqueado: (v) => set({ desbloqueado: v }),
  reset: () => set({ prestamistaId: null, carteraActivaId: null, moneda: 'RD$', desbloqueado: false }),
}))
