import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types'

export type Alerta = Tables<'alertas'>

export async function getAlertas(prestamistaId: string): Promise<Alerta[]> {
  const { data, error } = await supabase
    .from('alertas')
    .select('*')
    .eq('prestamista_id', prestamistaId)
    .order('fecha_alerta', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return data ?? []
}

export async function contarNoLeidas(prestamistaId: string): Promise<number> {
  const { count, error } = await supabase
    .from('alertas')
    .select('id', { count: 'exact', head: true })
    .eq('prestamista_id', prestamistaId)
    .eq('leida', false)
  if (error) throw error
  return count ?? 0
}

export async function marcarLeida(id: string): Promise<void> {
  const { error } = await supabase.from('alertas').update({ leida: true }).eq('id', id)
  if (error) throw error
}

export async function marcarTodasLeidas(prestamistaId: string): Promise<void> {
  const { error } = await supabase
    .from('alertas')
    .update({ leida: true })
    .eq('prestamista_id', prestamistaId)
    .eq('leida', false)
  if (error) throw error
}
