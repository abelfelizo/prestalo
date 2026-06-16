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

export interface AccesoHeredero {
  autorizado: boolean
  dias_inactivo?: number
  dias_requeridos?: number
  prestamista?: string
  capital_en_calle?: number
  clientes?: { nombre: string; telefono: string; saldo: number }[]
}

/** Acceso del heredero: valida clave + inactividad del prestamista (función pública). */
export async function accesoHeredero(telefono: string, claveHash: string): Promise<AccesoHeredero | null> {
  const { data, error } = await supabase.rpc('acceso_heredero', {
    p_telefono: telefono,
    p_clave_hash: claveHash,
  })
  if (error) throw error
  return (data as unknown as AccesoHeredero) ?? null
}
