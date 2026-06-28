// Idempotencia de las escrituras: un reintento con el mismo client_op_id no duplica.
// Se mockea el cliente de Supabase para simular el upsert con ignoreDuplicates.

let upsertResult: { data: any[] | null; error: any }
let existente: { data: any; error: any }
const upsertSpy = jest.fn()

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      upsert: (input: any, opts: any) => {
        upsertSpy(input, opts)
        return { select: () => Promise.resolve(upsertResult) }
      },
      select: () => ({
        eq: () => ({ maybeSingle: () => Promise.resolve(existente) }),
      }),
    }),
  },
}))

import { crearCliente } from '@/api/clientes'
import { registrarPago } from '@/api/pagos'

beforeEach(() => {
  upsertSpy.mockClear()
  existente = { data: null, error: null }
})

describe('crearCliente idempotente', () => {
  it('inserta normalmente y devuelve la fila', async () => {
    upsertResult = { data: [{ id: 'c1', nombre: 'Ana' }], error: null }
    const r = await crearCliente({ cartera_id: 'k1', nombre: 'Ana', telefono: '809', client_op_id: 'op-1' } as any)
    expect(r.id).toBe('c1')
    expect(upsertSpy).toHaveBeenCalledWith(expect.objectContaining({ client_op_id: 'op-1' }), expect.objectContaining({ onConflict: 'client_op_id', ignoreDuplicates: true }))
  })

  it('duplicado (upsert vacío) recupera el existente sin crear otro', async () => {
    upsertResult = { data: [], error: null }
    existente = { data: { id: 'c1', nombre: 'Ana' }, error: null }
    const r = await crearCliente({ cartera_id: 'k1', nombre: 'Ana', telefono: '809', client_op_id: 'op-1' } as any)
    expect(r.id).toBe('c1')
  })
})

describe('registrarPago idempotente', () => {
  it('inserta normalmente y devuelve la fila', async () => {
    upsertResult = { data: [{ id: 'p1', monto_total: 500 }], error: null }
    const r = await registrarPago({ prestamo_id: 'l1', cliente_id: 'c1', monto_total: 500, client_op_id: 'op-2' } as any)
    expect(r.id).toBe('p1')
  })

  it('duplicado recupera el pago existente (no cobra dos veces)', async () => {
    upsertResult = { data: [], error: null }
    existente = { data: { id: 'p1', monto_total: 500 }, error: null }
    const r = await registrarPago({ prestamo_id: 'l1', cliente_id: 'c1', monto_total: 500, client_op_id: 'op-2' } as any)
    expect(r.id).toBe('p1')
  })
})
