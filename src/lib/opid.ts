import * as Crypto from 'expo-crypto'

/**
 * Genera un identificador único para una operación de escritura (pago, préstamo, caja).
 * Se incluye en el payload ANTES de encolar en el outbox, así un reintento usa el mismo
 * id y la BD lo ignora (constraint UNIQUE) en vez de duplicar la operación.
 */
export function nuevoOpId(): string {
  return Crypto.randomUUID()
}
