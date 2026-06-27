import { supabase } from '@/lib/supabase'
import type { Cartera, Inserts, Prestamista } from '@/types'

export async function crearCartera(input: Inserts<'carteras'>): Promise<Cartera> {
  const { data, error } = await supabase.from('carteras').insert(input).select().single()
  if (error) throw error
  // El capital inicial debe reflejarse en el balance de caja como una entrada.
  if (input.capital_inicial && input.capital_inicial > 0) {
    await supabase.from('caja').insert({
      cartera_id: data.id,
      tipo: 'entrada',
      categoria: 'capital_nuevo',
      monto: input.capital_inicial,
      descripcion: 'Capital inicial de la cartera',
      fecha: new Date().toISOString().slice(0, 10),
    })
  }
  return data
}

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

/** Carteras a las que el usuario tiene acceso (propias + compartidas). RLS filtra. */
export async function getCarterasAccesibles(): Promise<Cartera[]> {
  const { data, error } = await supabase.from('carteras').select('*').eq('activa', true).order('created_at')
  if (error) throw error
  return data ?? []
}

/** Invita a un colaborador (por email) a la cartera. Devuelve 'ok' | 'no_existe'. */
export async function invitarColaborador(carteraId: string, email: string): Promise<string> {
  const { data, error } = await supabase.rpc('invitar_colaborador', {
    p_cartera_id: carteraId,
    p_email: email,
  })
  if (error) throw error
  return String(data)
}

export async function getCartera(id: string): Promise<Cartera | null> {
  const { data, error } = await supabase.from('carteras').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

/** Registra actividad del prestamista (para el "interruptor de inactividad" de herederos). */
export async function registrarActividad(prestamistaId: string): Promise<void> {
  await supabase.from('prestamistas').update({ updated_at: new Date().toISOString() }).eq('id', prestamistaId)
}

export async function setCarteraActiva(prestamistaId: string, carteraId: string): Promise<void> {
  const { error } = await supabase
    .from('prestamistas')
    .update({ cartera_activa_id: carteraId })
    .eq('id', prestamistaId)
  if (error) throw error
}
