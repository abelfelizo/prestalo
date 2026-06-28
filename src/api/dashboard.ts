import { supabase } from '@/lib/supabase'

export interface MetricasCartera {
  capital_en_calle: number // saldo pendiente de préstamos activos
  total_prestado: number // capital desembolsado vigente
  clientes_activos: number
  prestamos_en_mora: number
}

export async function getMetricas(carteraId: string): Promise<MetricasCartera> {
  // Agregación en el servidor (RPC) para escalar con muchos préstamos.
  const { data, error } = await (supabase.rpc as any)('metricas_cartera', { p_cartera: carteraId })
  if (error) throw error
  const r = (Array.isArray(data) ? data[0] : data) ?? {}
  return {
    capital_en_calle: Number(r.capital_en_calle || 0),
    total_prestado: Number(r.total_prestado || 0),
    clientes_activos: Number(r.clientes_activos || 0),
    prestamos_en_mora: Number(r.prestamos_en_mora || 0),
  }
}
