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
  const { data: prestamos, error } = await supabase
    .from('prestamos')
    .select('monto_capital, saldo_pendiente, estado, total_intereses_generados, total_mora_generada, cliente_id')
    .eq('cartera_id', carteraId)
    .is('deleted_at', null)
  if (error) throw error

  const { data: caja, error: cajaError } = await supabase
    .from('caja')
    .select('monto, categoria, tipo')
    .eq('cartera_id', carteraId)
    .is('deleted_at', null)
  if (cajaError) throw cajaError

  const rows = prestamos ?? []
  const cobrado = (caja ?? [])
    .filter((c) => c.tipo === 'entrada' && (c.categoria === 'cobro' || c.categoria === 'cobro_mora'))
    .reduce((sum, c) => sum + Number(c.monto), 0)

  const porEstado: Record<string, number> = {}
  rows.forEach((r) => { porEstado[r.estado] = (porEstado[r.estado] || 0) + 1 })
  const activos = rows.filter((r) => r.estado === 'activo' || r.estado === 'en_mora')

  return {
    total_prestado: rows.reduce((s, r) => s + Number(r.monto_capital || 0), 0),
    capital_en_calle: activos.reduce((s, r) => s + Number(r.saldo_pendiente || 0), 0),
    intereses_generados: rows.reduce((s, r) => s + Number(r.total_intereses_generados || 0), 0),
    mora_generada: rows.reduce((s, r) => s + Number(r.total_mora_generada || 0), 0),
    total_cobrado: cobrado,
    por_estado: porEstado,
    clientes: new Set(rows.map((r) => r.cliente_id)).size,
  }
}
