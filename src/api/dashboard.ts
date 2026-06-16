import { supabase } from '@/lib/supabase'

export interface MetricasCartera {
  capital_en_calle: number // saldo pendiente de préstamos activos
  total_prestado: number // capital desembolsado vigente
  clientes_activos: number
  prestamos_en_mora: number
}

export async function getMetricas(carteraId: string): Promise<MetricasCartera> {
  const { data, error } = await supabase
    .from('prestamos')
    .select('monto_capital, saldo_pendiente, estado, cliente_id')
    .eq('cartera_id', carteraId)
    .is('deleted_at', null)
  if (error) throw error

  const rows = data ?? []
  const activos = rows.filter((r) => r.estado === 'activo' || r.estado === 'en_mora')
  return {
    capital_en_calle: activos.reduce((s, r) => s + Number(r.saldo_pendiente || 0), 0),
    total_prestado: activos.reduce((s, r) => s + Number(r.monto_capital || 0), 0),
    clientes_activos: new Set(activos.map((r) => r.cliente_id)).size,
    prestamos_en_mora: rows.filter((r) => r.estado === 'en_mora').length,
  }
}
