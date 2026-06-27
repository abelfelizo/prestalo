import * as SecureStore from 'expo-secure-store'
import * as Crypto from 'expo-crypto'
import * as LocalAuthentication from 'expo-local-authentication'

const PIN_KEY = 'prestalo_pin_hash'
const PIN_SALT_KEY = 'kuotas_pin_salt'
const PIN_FAILS_KEY = 'kuotas_pin_fails'
const PIN_LOCK_KEY = 'kuotas_pin_lock_until'

export const PIN_MAX_FALLOS = 5
const PIN_BLOQUEO_MS = 5 * 60 * 1000 // 5 minutos

/**
 * Hash SIN sal. Se usa para la clave del heredero (debe coincidir entre dispositivos,
 * el heredero la teclea en SU teléfono) y para el pin_hash del servidor / compatibilidad.
 * NO usar para verificar el PIN local: para eso está el hash con sal de abajo.
 */
export async function hashPin(pin: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin)
}

async function getOrCreateSalt(): Promise<string> {
  let salt = await SecureStore.getItemAsync(PIN_SALT_KEY)
  if (!salt) {
    salt = Crypto.randomUUID()
    await SecureStore.setItemAsync(PIN_SALT_KEY, salt)
  }
  return salt
}

async function hashConSal(pin: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}:${pin}`)
}

/** Guarda el hash del PIN (con sal por dispositivo) en almacenamiento seguro local. */
export async function guardarPinLocal(pin: string): Promise<string> {
  const salt = await getOrCreateSalt()
  const h = await hashConSal(pin, salt)
  await SecureStore.setItemAsync(PIN_KEY, h)
  await limpiarFallosPin()
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
  const salt = await SecureStore.getItemAsync(PIN_SALT_KEY)
  if (salt) return (await hashConSal(pin, salt)) === stored
  // PIN antiguo guardado sin sal: verificar legacy y, si acierta, migrar a salado.
  if ((await hashPin(pin)) === stored) {
    await guardarPinLocal(pin)
    return true
  }
  return false
}

export async function limpiarPinLocal(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_KEY)
  await limpiarFallosPin()
}

// ---- Anti fuerza-bruta del PIN local ----

/** Milisegundos que faltan para que se levante el bloqueo (0 = no bloqueado). */
export async function pinBloqueadoMs(): Promise<number> {
  const until = Number(await SecureStore.getItemAsync(PIN_LOCK_KEY)) || 0
  return Math.max(0, until - Date.now())
}

/** Registra un intento fallido. Bloquea 5 min al llegar a PIN_MAX_FALLOS. */
export async function registrarFalloPin(): Promise<{ bloqueado: boolean; restantes: number }> {
  const fallos = (Number(await SecureStore.getItemAsync(PIN_FAILS_KEY)) || 0) + 1
  if (fallos >= PIN_MAX_FALLOS) {
    await SecureStore.setItemAsync(PIN_LOCK_KEY, String(Date.now() + PIN_BLOQUEO_MS))
    await SecureStore.setItemAsync(PIN_FAILS_KEY, '0')
    return { bloqueado: true, restantes: 0 }
  }
  await SecureStore.setItemAsync(PIN_FAILS_KEY, String(fallos))
  return { bloqueado: false, restantes: PIN_MAX_FALLOS - fallos }
}

export async function limpiarFallosPin(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_FAILS_KEY)
  await SecureStore.deleteItemAsync(PIN_LOCK_KEY)
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
