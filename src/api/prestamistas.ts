import { supabase } from '@/lib/supabase'
import type { Cartera, Prestamista } from '@/types'

/** Trae el prestamista del usuario autenticado (o null si aún no completó onboarding). */
export async function getPrestamista(userId: string): Promise<Prestamista | null> {
  const { data, error } = await supabase
    .from('prestamistas')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getCarteras(prestamistaId: string): Promise<Cartera[]> {
  const { data, error } = await supabase
    .from('carteras')
    .select('*')
    .eq('prestamista_id', prestamistaId)
    .eq('activa', true)
    .order('created_at')
  if (error) throw error
  return data ?? []
}

export async function setCarteraActiva(prestamistaId: string, carteraId: string): Promise<void> {
  const { error } = await supabase
    .from('prestamistas')
    .update({ cartera_activa_id: carteraId })
    .eq('id', prestamistaId)
  if (error) throw error
}
