import { supabase } from '@/lib/supabase'
import type { Caja, Inserts } from '@/types'

export async function getMovimientos(carteraId: string): Promise<Caja[]> {
  const { data, error } = await supabase
    .from('caja')
    .select('*')
    .eq('cartera_id', carteraId)
    .order('fecha', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getBalanceCaja(carteraId: string): Promise<number> {
  const { data, error } = await supabase.from('caja').select('tipo, monto').eq('cartera_id', carteraId)
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
