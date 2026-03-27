export type Moneda = 'RD$' | 'USD' | 'EUR' | 'COP' | 'MXN'
export type EstadoPrestamo = 'activo' | 'completado' | 'vencido' | 'cancelado'
export type TipoInteres = 'flat' | 'sobre_saldo'

export interface Cliente {
  id: string
  cartera_id: string
  nombre: string
  apodo?: string
  telefono?: string
  score: number
  notas?: string
  created_at: string
}

export interface Prestamo {
  id: string
  cartera_id: string
  cliente_id: string
  monto_principal: number
  tasa_interes: number
  tipo_interes: TipoInteres
  plazo_semanas: number
  fecha_inicio: string
  fecha_vencimiento: string
  estado: EstadoPrestamo
  monto_total: number
  total_pagado: number
  saldo_pendiente: number
}

export interface MetricasCartera {
  total_prestado: number
  total_cobrado: number
  saldo_pendiente: number
  clientes_activos: number
  prestamos_vencidos: number
}
