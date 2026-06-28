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

/** Edita datos del perfil del prestamista. */
export async function editarPerfil(
  id: string,
  patch: Partial<Pick<Inserts<'prestamistas'>, 'nombre' | 'telefono' | 'metodo_seguridad'>>,
): Promise<void> {
  const { error } = await supabase.from('prestamistas').update(patch).eq('id', id)
  if (error) throw error
}

/** Edita nombre/color/moneda de una cartera. */
export async function editarCartera(
  id: string,
  patch: Partial<Pick<Inserts<'carteras'>, 'nombre' | 'color' | 'moneda'>>,
): Promise<void> {
  const { error } = await supabase.from('carteras').update(patch).eq('id', id)
  if (error) throw error
}

/** Archiva una cartera (no se borra; deja de listarse). */
export async function archivarCartera(id: string): Promise<void> {
  const { error } = await supabase.from('carteras').update({ activa: false }).eq('id', id)
  if (error) throw error
}

export interface PermisosColaborador {
  pagos?: boolean
  clientes?: boolean
  prestamos?: boolean
  caja?: boolean
}

export interface Colaborador {
  user_id: string
  email: string
  rol: string
  permisos: PermisosColaborador
}

/** Lista los colaboradores con acceso a una cartera (solo el dueño). */
export async function getColaboradores(carteraId: string): Promise<Colaborador[]> {
  const { data, error } = await (supabase.rpc as any)('colaboradores_de_cartera', { p_cartera: carteraId })
  if (error) throw error
  return ((data as any[]) ?? []).map((c) => ({ ...c, permisos: c.permisos ?? {} }))
}

/** Revoca el acceso de un colaborador a una cartera (solo el dueño). */
export async function revocarColaborador(carteraId: string, userId: string): Promise<void> {
  const { error } = await (supabase.rpc as any)('revocar_colaborador', { p_cartera: carteraId, p_user: userId })
  if (error) throw error
}

/** El dueño define los permisos de un colaborador. */
export async function setPermisosColaborador(carteraId: string, userId: string, permisos: PermisosColaborador): Promise<void> {
  const { error } = await (supabase.rpc as any)('set_permisos_colaborador', { p_cartera: carteraId, p_user: userId, p_permisos: permisos })
  if (error) throw error
}

/** Permisos del usuario actual sobre una cartera (el dueño tiene todos). */
export async function getMisPermisos(carteraId: string): Promise<Record<string, boolean>> {
  const { data, error } = await (supabase.rpc as any)('mis_permisos_cartera', { p_cartera: carteraId })
  if (error) throw error
  return (data as Record<string, boolean>) ?? {}
}
