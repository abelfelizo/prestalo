import { supabase } from '@/lib/supabase'
import type { Garantia, Inserts } from '@/types'

export async function getGarantias(prestamoId: string): Promise<Garantia[]> {
  const { data, error } = await supabase
    .from('garantias')
    .select('*')
    .eq('prestamo_id', prestamoId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function crearGarantia(input: Inserts<'garantias'>): Promise<Garantia> {
  const { data, error } = await supabase.from('garantias').insert(input).select().single()
  if (error) throw error
  return data
}

export async function editarGarantia(id: string, patch: Partial<Inserts<'garantias'>>): Promise<void> {
  const { error } = await supabase.from('garantias').update(patch).eq('id', id)
  if (error) throw error
}

/** Borrado lógico de la garantía (recuperable). */
export async function eliminarGarantia(id: string): Promise<void> {
  const { error } = await supabase
    .from('garantias')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

/** Marca una garantía como devuelta. */
export async function devolverGarantia(id: string): Promise<void> {
  const { error } = await supabase
    .from('garantias')
    .update({ estado: 'devuelta', fecha_devuelta: new Date().toISOString().slice(0, 10) })
    .eq('id', id)
  if (error) throw error
}
