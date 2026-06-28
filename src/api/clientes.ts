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
  // Idempotente: un reintento con el mismo client_op_id no crea un cliente duplicado.
  const { data, error } = await supabase
    .from('clientes')
    .upsert(input, { onConflict: 'client_op_id', ignoreDuplicates: true })
    .select()
  if (error) throw error
  if (data && data.length) return data[0]
  if (input.client_op_id) {
    const { data: existente, error: e2 } = await supabase
      .from('clientes')
      .select('*')
      .eq('client_op_id', input.client_op_id)
      .maybeSingle()
    if (e2) throw e2
    if (existente) return existente
  }
  throw new Error('No se pudo crear el cliente')
}

export async function editarCliente(id: string, patch: Partial<Inserts<'clientes'>>): Promise<void> {
  const { error } = await supabase.from('clientes').update(patch).eq('id', id)
  if (error) throw error
}

/** Borrado lógico del cliente. */
export async function eliminarCliente(id: string): Promise<void> {
  const { error } = await supabase
    .from('clientes')
    .update({ deleted_at: new Date().toISOString(), activo: false })
    .eq('id', id)
  if (error) throw error
}
