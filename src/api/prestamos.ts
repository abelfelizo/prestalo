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

/**
 * Crea un préstamo. El trigger `registrar_desembolso_caja` registra la salida de caja.
 * `saldo_pendiente` debe venir = total a cobrar (capital + intereses).
 */
export async function crearPrestamo(input: Inserts<'prestamos'>): Promise<Prestamo> {
  const { data, error } = await supabase.from('prestamos').insert(input).select().single()
  if (error) throw error
  return data
}
