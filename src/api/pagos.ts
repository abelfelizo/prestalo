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
  // Idempotente: si este pago (mismo client_op_id) ya se insertó en un intento previo,
  // la BD lo ignora y recuperamos el existente en vez de cobrar dos veces.
  const { data, error } = await supabase
    .from('pagos')
    .upsert(input, { onConflict: 'client_op_id', ignoreDuplicates: true })
    .select()
  if (error) throw error
  if (data && data.length) return data[0]
  if (input.client_op_id) {
    const { data: existente, error: e2 } = await supabase
      .from('pagos')
      .select('*')
      .eq('client_op_id', input.client_op_id)
      .maybeSingle()
    if (e2) throw e2
    if (existente) return existente
  }
  throw new Error('No se pudo registrar el pago')
}

/** Anula un pago (revierte saldo, cuotas, caja y totales del cliente). */
export async function anularPago(pagoId: string): Promise<void> {
  const { error } = await supabase.rpc('anular_pago', { p_pago_id: pagoId })
  if (error) throw error
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
