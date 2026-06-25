import * as SecureStore from 'expo-secure-store'
import * as Crypto from 'expo-crypto'
import * as LocalAuthentication from 'expo-local-authentication'

const PIN_KEY = 'prestalo_pin_hash'

export async function hashPin(pin: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin)
}

/** Guarda el hash del PIN en el almacenamiento seguro local (para verificación offline). */
export async function guardarPinLocal(pin: string): Promise<string> {
  const h = await hashPin(pin)
  await SecureStore.setItemAsync(PIN_KEY, h)
  return h
}

export async function setPinHashLocal(hash: string): Promise<void> {
  await SecureStore.setItemAsync(PIN_KEY, hash)
}

export async function tienePinLocal(): Promise<boolean> {
  return !!(await SecureStore.getItemAsync(PIN_KEY))
}

export async function verificarPinLocal(pin: string): Promise<boolean> {
  const stored = await SecureStore.getItemAsync(PIN_KEY)
  if (!stored) return false
  return (await hashPin(pin)) === stored
}

export async function limpiarPinLocal(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_KEY)
}

// ---- Biometría ----
export async function biometriaDisponible(): Promise<boolean> {
  const [hw, enrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ])
  return hw && enrolled
}

export async function autenticarBiometria(): Promise<boolean> {
  const r = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Desbloquear Kuotas',
    cancelLabel: 'Usar PIN',
  })
  return r.success
}
