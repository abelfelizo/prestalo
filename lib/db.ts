import { supabase } from './supabase'

export async function getCarteras(prestamista_id: string) {
  const { data, error } = await supabase
    .from('carteras')
    .select('*')
    .eq('prestamista_id', prestamista_id)
    .eq('activa', true)
  if (error) throw error
  return data || []
}

export async function getClientes(cartera_id: string) {
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .eq('cartera_id', cartera_id)
    .order('nombre')
  if (error) throw error
  return data || []
}

export async function getPrestamos(cartera_id: string) {
  const { data, error } = await supabase
    .from('prestamos')
    .select('*, clientes(nombre, telefono, score)')
    .eq('cartera_id', cartera_id)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getMetricas(cartera_id: string) {
  const { data, error } = await supabase
    .from('prestamos')
    .select('monto_principal, total_pagado, saldo_pendiente, estado, cliente_id')
    .eq('cartera_id', cartera_id)
  if (error) throw error
  const activos = (data || []).filter(p => p.estado === 'activo')
  const vencidos = (data || []).filter(p => p.estado === 'vencido')
  const clientesUnicos = new Set(activos.map(p => p.cliente_id)).size
  return {
    total_prestado: activos.reduce((s, p) => s + (p.monto_principal || 0), 0),
    total_cobrado: activos.reduce((s, p) => s + (p.total_pagado || 0), 0),
    saldo_pendiente: activos.reduce((s, p) => s + (p.saldo_pendiente || 0), 0),
    clientes_activos: clientesUnicos,
    prestamos_vencidos: vencidos.length,
  }
}

export async function registrarPago(prestamo_id: string, cliente_id: string, cartera_id: string, monto: number) {
  const { data, error } = await supabase
    .from('pagos')
    .insert({ prestamo_id, cliente_id, cartera_id, monto, fecha_pago: new Date().toISOString().split('T')[0], estado: 'pagado' })
    .select()
    .single()
  if (error) throw error
  return data
}
