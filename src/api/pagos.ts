import { supabase } from '@/lib/supabase'
import type { Inserts, Pago } from '@/types'

/**
 * Registra un pago. Los triggers de la BD se encargan de:
 *  - actualizar saldo / cuotas_pagadas / estado del préstamo,
 *  - ajustar score y veces_atrasado del cliente,
 *  - registrar el cobro (y la mora) en caja,
 *  - avanzar la fecha de próximo pago.
 * La app solo debe enviar el desglose correcto (ver desglosarCuota en lib/calculos).
 */
export async function registrarPago(input: Inserts<'pagos'>): Promise<Pago> {
  const { data, error } = await supabase.from('pagos').insert(input).select().single()
  if (error) throw error
  return data
}

export async function getPagosDePrestamo(prestamoId: string): Promise<Pago[]> {
  const { data, error } = await supabase
    .from('pagos')
    .select('*')
    .eq('prestamo_id', prestamoId)
    .order('fecha_pago', { ascending: false })
  if (error) throw error
  return data ?? []
}
