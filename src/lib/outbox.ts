import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo'
import { crearCliente } from '@/api/clientes'
import { crearPrestamo } from '@/api/prestamos'
import { registrarPago } from '@/api/pagos'
import { crearMovimiento } from '@/api/caja'

const KEY = 'prestalo-outbox'

export type OutboxOp = 'crearCliente' | 'crearPrestamo' | 'registrarPago' | 'crearMovimiento'

const REGISTRY: Record<OutboxOp, (args: any) => Promise<unknown>> = {
  crearCliente: (a) => crearCliente(a),
  crearPrestamo: (a) => crearPrestamo(a),
  registrarPago: (a) => registrarPago(a),
  crearMovimiento: (a) => crearMovimiento(a),
}

export interface PendingOp {
  id: string
  op: OutboxOp
  args: unknown
  createdAt: number
}

async function leer(): Promise<PendingOp[]> {
  const raw = await AsyncStorage.getItem(KEY)
  return raw ? (JSON.parse(raw) as PendingOp[]) : []
}
async function escribir(ops: PendingOp[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(ops))
}

export async function contarPendientes(): Promise<number> {
  return (await leer()).length
}

async function encolar(op: OutboxOp, args: unknown): Promise<void> {
  const ops = await leer()
  ops.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, op, args, createdAt: Date.now() })
  await escribir(ops)
}

function esErrorDeRed(e: any): boolean {
  const m = String(e?.message ?? '').toLowerCase()
  return m.includes('network') || m.includes('fetch') || m.includes('timeout') || m.includes('failed to')
}

/**
 * Ejecuta una operación de escritura. Si no hay conexión (o falla por red),
 * la guarda en el outbox para sincronizarla luego. Devuelve si quedó encolada.
 */
export async function ejecutar(op: OutboxOp, args: unknown): Promise<{ encolado: boolean }> {
  const state = await NetInfo.fetch().catch(() => null)
  if (state && state.isConnected === false) {
    await encolar(op, args)
    return { encolado: true }
  }
  try {
    await REGISTRY[op](args)
    return { encolado: false }
  } catch (e) {
    if (esErrorDeRed(e)) {
      await encolar(op, args)
      return { encolado: true }
    }
    throw e
  }
}

let sincronizando = false
/** Procesa la cola; devuelve cuántas operaciones se sincronizaron. */
export async function flush(): Promise<number> {
  if (sincronizando) return 0
  sincronizando = true
  try {
    const ops = await leer()
    if (ops.length === 0) return 0
    const restantes: PendingOp[] = []
    for (const o of ops) {
      try {
        await REGISTRY[o.op](o.args)
      } catch (e) {
        if (esErrorDeRed(e)) restantes.push(o) // sigue pendiente
        // si no es de red (datos inválidos), se descarta para no bloquear la cola
      }
    }
    await escribir(restantes)
    return ops.length - restantes.length
  } finally {
    sincronizando = false
  }
}

/** Sincroniza automáticamente al recuperar conexión. */
export function iniciarAutoSync(onFlush?: (n: number) => void): () => void {
  return NetInfo.addEventListener((state) => {
    if (state.isConnected) {
      flush().then((n) => {
        if (n > 0) onFlush?.(n)
      })
    }
  })
}
