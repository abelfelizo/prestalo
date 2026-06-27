import { supabase } from '@/lib/supabase'
import type { Caja, Inserts } from '@/types'

export async function getMovimientos(carteraId: string): Promise<Caja[]> {
  const { data, error } = await supabase
    .from('caja')
    .select('*')
    .eq('cartera_id', carteraId)
    .is('deleted_at', null)
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getMovimiento(id: string): Promise<Caja | null> {
  const { data, error } = await supabase.from('caja').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function getBalanceCaja(carteraId: string): Promise<number> {
  const { data, error } = await supabase
    .from('caja')
    .select('tipo, monto')
    .eq('cartera_id', carteraId)
    .is('deleted_at', null)
  if (error) throw error
  return (data ?? []).reduce(
    (s, m) => s + (m.tipo === 'entrada' ? Number(m.monto) : -Number(m.monto)),
    0,
  )
}

export async function crearMovimiento(input: Inserts<'caja'>): Promise<Caja> {
  // Idempotente: un reintento con el mismo client_op_id no duplica el movimiento.
  const { data, error } = await supabase
    .from('caja')
    .upsert(input, { onConflict: 'client_op_id', ignoreDuplicates: true })
    .select()
  if (error) throw error
  if (data && data.length) return data[0]
  if (input.client_op_id) {
    const { data: existente, error: e2 } = await supabase
      .from('caja')
      .select('*')
      .eq('client_op_id', input.client_op_id)
      .maybeSingle()
    if (e2) throw e2
    if (existente) return existente
  }
  throw new Error('No se pudo registrar el movimiento')
}

export async function editarMovimiento(id: string, patch: Partial<Inserts<'caja'>>): Promise<void> {
  const { error } = await supabase.from('caja').update(patch).eq('id', id)
  if (error) throw error
}

/** Borrado lógico del movimiento (recuperable). */
export async function eliminarMovimiento(id: string): Promise<void> {
  const { error } = await supabase
    .from('caja')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}
