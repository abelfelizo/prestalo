import { create } from 'zustand'

interface PinPromptState {
  visible: boolean
  mensaje: string
  onSuccess: (() => void) | null
  pedirPin: (onSuccess: () => void, mensaje?: string) => void
  cerrar: () => void
}

/** Pide el PIN de 4 dígitos antes de una acción sensible (borrar/anular). */
export const usePinPrompt = create<PinPromptState>((set) => ({
  visible: false,
  mensaje: '',
  onSuccess: null,
  pedirPin: (onSuccess, mensaje = 'Ingresa tu PIN para confirmar') =>
    set({ visible: true, onSuccess, mensaje }),
  cerrar: () => set({ visible: false, onSuccess: null }),
}))
