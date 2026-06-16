import { create } from 'zustand'

interface SessionState {
  prestamistaId: string | null
  carteraActivaId: string | null
  desbloqueado: boolean // PIN/biometría superado en esta sesión de app
  setPrestamista: (id: string | null) => void
  setCarteraActiva: (id: string | null) => void
  setDesbloqueado: (v: boolean) => void
  reset: () => void
}

export const useSession = create<SessionState>((set) => ({
  prestamistaId: null,
  carteraActivaId: null,
  desbloqueado: false,
  setPrestamista: (id) => set({ prestamistaId: id }),
  setCarteraActiva: (id) => set({ carteraActivaId: id }),
  setDesbloqueado: (v) => set({ desbloqueado: v }),
  reset: () => set({ prestamistaId: null, carteraActivaId: null, desbloqueado: false }),
}))
