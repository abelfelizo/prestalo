import type { ModeloInteres, Frecuencia } from '@/types'

const DIAS_POR_FRECUENCIA: Record<Frecuencia, number> = {
  diario: 1,
  semanal: 7,
  quincenal: 15,
  mensual: 30,
}

export interface ResumenPrestamo {
  montoTotal: number // capital + intereses (= saldo_pendiente inicial)
  interesTotal: number
  cuota: number
}

/** Calcula el total a cobrar y la cuota de un préstamo. */
export function calcularPrestamo(
  capital: number,
  tasa: number,
  modelo: ModeloInteres,
  numCuotas: number,
): ResumenPrestamo {
  if (numCuotas <= 0) return { montoTotal: capital, interesTotal: 0, cuota: capital }

  if (modelo === 'flat') {
    const interesTotal = capital * (tasa / 100) * numCuotas
    const montoTotal = capital + interesTotal
    return { montoTotal, interesTotal, cuota: montoTotal / numCuotas }
  }

  // sobre_saldo: el interés se calcula sobre el saldo decreciente
  let saldo = capital
  let interesTotal = 0
  for (let i = 0; i < numCuotas; i++) {
    interesTotal += saldo * (tasa / 100)
    saldo -= capital / numCuotas
  }
  const montoTotal = capital + interesTotal
  return { montoTotal, interesTotal, cuota: montoTotal / numCuotas }
}

export interface CuotaCalendario {
  numero: number
  fecha: string // YYYY-MM-DD
  monto: number
}

/** Genera el calendario de cuotas (la BD no guarda cuotas individuales; es para preview/UI). */
export function generarCalendario(
  fechaInicio: string,
  numCuotas: number,
  frecuencia: Frecuencia,
  cuota: number,
): CuotaCalendario[] {
  const out: CuotaCalendario[] = []
  const base = new Date(fechaInicio)
  for (let i = 1; i <= numCuotas; i++) {
    const d = new Date(base)
    if (frecuencia === 'mensual') d.setMonth(d.getMonth() + i)
    else d.setDate(d.getDate() + DIAS_POR_FRECUENCIA[frecuencia] * i)
    out.push({ numero: i, fecha: d.toISOString().slice(0, 10), monto: cuota })
  }
  return out
}

/** Primera fecha de cobro a partir de la fecha de inicio. */
export function primeraFechaPago(fechaInicio: string, frecuencia: Frecuencia): string {
  const d = new Date(fechaInicio)
  if (frecuencia === 'mensual') d.setMonth(d.getMonth() + 1)
  else d.setDate(d.getDate() + DIAS_POR_FRECUENCIA[frecuencia])
  return d.toISOString().slice(0, 10)
}

export interface DesglosePago {
  monto_total: number
  monto_capital: number
  monto_interes: number
  monto_mora: number
  saldo_antes: number
  saldo_despues: number
}

/**
 * Desglosa un pago de cuota completa para insertar en `pagos`.
 * Los triggers de la BD actualizan saldo del préstamo, score del cliente y caja.
 */
export function desglosarCuota(
  saldoAntes: number,
  capital: number,
  interesTotal: number,
  numCuotas: number,
  mora = 0,
): DesglosePago {
  const cap = numCuotas > 0 ? capital / numCuotas : capital
  const int = numCuotas > 0 ? interesTotal / numCuotas : interesTotal
  const aplicadoAlSaldo = cap + int
  return {
    monto_total: aplicadoAlSaldo + mora,
    monto_capital: cap,
    monto_interes: int,
    monto_mora: mora,
    saldo_antes: saldoAntes,
    saldo_despues: Math.max(saldoAntes - aplicadoAlSaldo, 0),
  }
}

/** Días de atraso respecto a la fecha de próximo pago. */
export function diasMora(fechaProximoPago: string | null): number {
  if (!fechaProximoPago) return 0
  const hoy = new Date()
  const vence = new Date(fechaProximoPago)
  if (hoy <= vence) return 0
  return Math.floor((hoy.getTime() - vence.getTime()) / 86_400_000)
}

/** Formatea un monto con la moneda de la cartera. */
export function fmt(monto: number | null | undefined, moneda = 'RD$'): string {
  return `${moneda} ${Number(monto || 0).toLocaleString('es-DO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}
