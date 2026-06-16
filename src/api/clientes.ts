import { supabase } from '@/lib/supabase'
import type { Cliente, Inserts } from '@/types'

export async function getClientes(carteraId: string): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('cartera_id', carteraId)
    .is('deleted_at', null)
    .order('nombre')
  if (error) throw error
  return data ?? []
}

export async function getCliente(id: string): Promise<Cliente | null> {
  const { data, error } = await supabase.from('clientes').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function crearCliente(input: Inserts<'clientes'>): Promise<Cliente> {
  const { data, error } = await supabase.from('clientes').insert(input).select().single()
  if (error) throw error
  return data
}
