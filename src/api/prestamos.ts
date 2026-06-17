import { supabase } from '@/lib/supabase'
import type { Inserts, Prestamo, PrestamoConCliente } from '@/types'

const SELECT_CON_CLIENTE = '*, clientes(nombre, telefono, score)'

export async function getPrestamos(carteraId: string): Promise<PrestamoConCliente[]> {
  const { data, error } = await supabase
    .from('prestamos')
    .select(SELECT_CON_CLIENTE)
    .eq('cartera_id', carteraId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as PrestamoConCliente[]
}

/** Mueve la fecha de próximo pago (prórroga), limpia mora y deja el préstamo activo. */
export async function otorgarProrroga(prestamoId: string, nuevaFechaProximo: string): Promise<void> {
  const { error } = await supabase
    .from('prestamos')
    .update({ fecha_proximo_pago: nuevaFechaProximo, dias_en_mora: 0, estado: 'activo' })
    .eq('id', prestamoId)
  if (error) throw error
}

/** Marca un préstamo como refinanciado (su saldo pasa a un préstamo nuevo). */
export async function marcarRefinanciado(prestamoId: string): Promise<void> {
  const { error } = await supabase.from('prestamos').update({ estado: 'refinanciado' }).eq('id', prestamoId)
  if (error) throw error
}

/** Edita campos de un préstamo (usar solo si no tiene pagos registrados). */
export async function editarPrestamo(id: string, patch: Partial<Inserts<'prestamos'>>): Promise<void> {
  const { error } = await supabase.from('prestamos').update(patch).eq('id', id)
  if (error) throw error
}

/** Cancela un préstamo (queda sin efecto, no se cobra). */
export async function cancelarPrestamo(prestamoId: string): Promise<void> {
  const { error } = await supabase
    .from('prestamos')
    .update({ estado: 'cancelado', deleted_at: new Date().toISOString() })
    .eq('id', prestamoId)
  if (error) throw error
}

export async function getPrestamosDeCliente(clienteId: string): Promise<PrestamoConCliente[]> {
  const { data, error } = await supabase
    .from('prestamos')
    .select(SELECT_CON_CLIENTE)
    .eq('cliente_id', clienteId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as unknown as PrestamoConCliente[]
}

export async function getPrestamo(id: string): Promise<PrestamoConCliente | null> {
  const { data, error } = await supabase
    .from('prestamos')
    .select(SELECT_CON_CLIENTE)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return (data as unknown as PrestamoConCliente) ?? null
}

/** Préstamos cuyo próximo pago vence hoy o antes (cobros del día). */
export async function getCobrosHoy(carteraId: string): Promise<PrestamoConCliente[]> {
  const hoy = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase
    .from('prestamos')
    .select(SELECT_CON_CLIENTE)
    .eq('cartera_id', carteraId)
    .in('estado', ['activo', 'en_mora'])
    .lte('fecha_proximo_pago', hoy)
    .is('deleted_at', null)
    .order('fecha_proximo_pago')
  if (error) throw error
  return (data ?? []) as unknown as PrestamoConCliente[]
}

/** Préstamos por cobrar en los próximos `dias` días (incluye vencidos). */
export async function getProximosCobros(carteraId: string, dias = 7): Promise<PrestamoConCliente[]> {
  const hasta = new Date()
  hasta.setDate(hasta.getDate() + dias)
  const { data, error } = await supabase
    .from('prestamos')
    .select(SELECT_CON_CLIENTE)
    .eq('cartera_id', carteraId)
    .in('estado', ['activo', 'en_mora'])
    .lte('fecha_proximo_pago', hasta.toISOString().slice(0, 10))
    .is('deleted_at', null)
    .order('fecha_proximo_pago')
  if (error) throw error
  return (data ?? []) as unknown as PrestamoConCliente[]
}

/**
 * Crea un préstamo. El trigger `registrar_desembolso_caja` registra la salida de caja.
 * `saldo_pendiente` debe venir = total a cobrar (capital + intereses).
 */
export async function crearPrestamo(input: Inserts<'prestamos'>): Promise<Prestamo> {
  const { data, error } = await supabase.from('prestamos').insert(input).select().single()
  if (error) throw error
  return data
}
