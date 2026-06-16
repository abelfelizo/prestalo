import type { Database } from './database'

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

export type Prestamista = Tables<'prestamistas'>
export type Cartera = Tables<'carteras'>
export type Cliente = Tables<'clientes'>
export type Prestamo = Tables<'prestamos'>
export type Pago = Tables<'pagos'>
export type Caja = Tables<'caja'>
export type Garantia = Tables<'garantias'>
export type ConfiguracionCartera = Tables<'configuracion_cartera'>

// Enums del esquema real (CHECK constraints)
export type EstadoPrestamo = 'activo' | 'cerrado' | 'refinanciado' | 'en_mora'
export type ModeloInteres = 'flat' | 'sobre_saldo'
export type Frecuencia = 'diario' | 'semanal' | 'quincenal' | 'mensual'
export type TipoPago = 'cuota_completa' | 'solo_interes' | 'abono_capital' | 'parcial' | 'mora'
export type ColorCartera = 'green' | 'amber' | 'blue' | 'purple' | 'red'
export type MetodoSeguridad = 'face_id' | 'pin_4' | 'pin_6'

export type PrestamoConCliente = Prestamo & {
  clientes: Pick<Cliente, 'nombre' | 'telefono' | 'score'> | null
}
