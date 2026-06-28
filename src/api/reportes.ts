import { supabase } from '@/lib/supabase'

export interface Reporte {
  total_prestado: number
  capital_en_calle: number
  intereses_generados: number
  mora_generada: number
  total_cobrado: number
  por_estado: Record<string, number>
  clientes: number
}

export async function getReporte(carteraId: string): Promise<Reporte> {
  // Agregación en el servidor (RPC) para escalar con muchos préstamos.
  const { data, error } = await (supabase.rpc as any)('reporte_cartera', { p_cartera: carteraId })
  if (error) throw error
  const r = (data ?? {}) as any
  return {
    total_prestado: Number(r.total_prestado || 0),
    capital_en_calle: Number(r.capital_en_calle || 0),
    intereses_generados: Number(r.intereses_generados || 0),
    mora_generada: Number(r.mora_generada || 0),
    total_cobrado: Number(r.total_cobrado || 0),
    por_estado: (r.por_estado as Record<string, number>) ?? {},
    clientes: Number(r.clientes || 0),
  }
}
