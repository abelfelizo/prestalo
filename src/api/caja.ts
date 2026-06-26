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
  const { data, error } = await supabase.from('caja').insert(input).select().single()
  if (error) throw error
  return data
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
