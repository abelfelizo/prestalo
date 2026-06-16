import { supabase } from '@/lib/supabase'
import type { Inserts, Tables } from '@/types'

export type Heredero = Tables<'herederos'>

export async function getHerederos(prestamistaId: string): Promise<Heredero[]> {
  const { data, error } = await supabase
    .from('herederos')
    .select('*')
    .eq('prestamista_id', prestamistaId)
    .order('created_at')
  if (error) throw error
  return data ?? []
}

export async function crearHeredero(input: Inserts<'herederos'>): Promise<Heredero> {
  const { data, error } = await supabase.from('herederos').insert(input).select().single()
  if (error) throw error
  return data
}

export async function eliminarHeredero(id: string): Promise<void> {
  const { error } = await supabase.from('herederos').delete().eq('id', id)
  if (error) throw error
}
