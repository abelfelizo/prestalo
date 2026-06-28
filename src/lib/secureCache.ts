import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import * as Crypto from 'expo-crypto'
import aesjs from 'aes-js'

/**
 * Almacenamiento cifrado para la caché local (TanStack Query).
 * - La clave AES-256 se genera una vez y vive en expo-secure-store (Keystore/Keychain del SO).
 * - Cada valor se cifra con AES-CTR y un IV aleatorio por escritura.
 * - Si un valor no se puede descifrar (caché vieja en claro o clave rotada), se trata como
 *   ausente: la app simplemente vuelve a pedir el dato. Nunca expone texto plano.
 *
 * Es JS puro (sin módulos nativos), así que se despliega por OTA sin recompilar el APK.
 */

const KEY_NAME = 'kuotas_cache_key'
let claveCache: Uint8Array | null = null

async function getClave(): Promise<Uint8Array> {
  if (claveCache) return claveCache
  let hex = await SecureStore.getItemAsync(KEY_NAME)
  if (!hex) {
    const bytes = await Crypto.getRandomBytesAsync(32) // AES-256
    hex = aesjs.utils.hex.fromBytes(bytes)
    await SecureStore.setItemAsync(KEY_NAME, hex)
  }
  claveCache = aesjs.utils.hex.toBytes(hex)
  return claveCache
}

async function cifrar(texto: string): Promise<string> {
  const clave = await getClave()
  const iv = await Crypto.getRandomBytesAsync(16)
  const ctr = new aesjs.ModeOfOperation.ctr(clave, new aesjs.Counter(iv))
  const cifrado = ctr.encrypt(aesjs.utils.utf8.toBytes(texto))
  return `${aesjs.utils.hex.fromBytes(iv)}:${aesjs.utils.hex.fromBytes(cifrado)}`
}

async function descifrar(blob: string): Promise<string | null> {
  try {
    const [ivHex, dataHex] = blob.split(':')
    if (!ivHex || !dataHex) return null
    const clave = await getClave()
    const ctr = new aesjs.ModeOfOperation.ctr(clave, new aesjs.Counter(aesjs.utils.hex.toBytes(ivHex)))
    return aesjs.utils.utf8.fromBytes(ctr.decrypt(aesjs.utils.hex.toBytes(dataHex)))
  } catch {
    return null
  }
}

/** Storage compatible con createAsyncStoragePersister, pero cifrando los valores. */
export const secureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    const raw = await AsyncStorage.getItem(key)
    if (raw == null) return null
    return descifrar(raw)
  },
  setItem: async (key: string, value: string): Promise<void> => {
    await AsyncStorage.setItem(key, await cifrar(value))
  },
  removeItem: async (key: string): Promise<void> => {
    await AsyncStorage.removeItem(key)
  },
}
