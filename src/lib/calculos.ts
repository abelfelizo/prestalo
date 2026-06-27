import type { ModeloInteres, Frecuencia } from '@/types'

const DIAS_POR_FRECUENCIA: Record<Frecuencia, number> = {
  diario: 1,
  semanal: 7,
  quincenal: 15,
  mensual: 30,
}

/** Factor de prorrateo del período respecto al mes (base de la tasa mensual). */
function factorPeriodo(frecuencia: Frecuencia): number {
  return (DIAS_POR_FRECUENCIA[frecuencia] ?? 30) / 30
}

/**
 * Interés de UNA cuota. Fuente única de verdad de la fórmula de interés
 * (la usan el cálculo total, el calendario y el interés de la próxima cuota).
 * - flat: interés total repartido en partes iguales = capital·tasa / nº cuotas.
 * - sobre_saldo: tasa mensual prorrateada sobre el capital que aún queda.
 * `cuotasPagadas` = nº de cuotas de capital ya abonadas antes de esta (0 para la primera).
 */
export function interesDeCuota(
  capital: number,
  tasa: number,
  modelo: ModeloInteres,
  numCuotas: number,
  frecuencia: Frecuencia,
  cuotasPagadas: number,
): number {
  if (numCuotas <= 0) return 0
  if (modelo === 'flat') return (capital * (tasa / 100)) / numCuotas
  const abonoCapital = capital / numCuotas
  const capitalRestante = Math.max(capital - cuotasPagadas * abonoCapital, 0)
  return capitalRestante * (tasa / 100) * factorPeriodo(frecuencia)
}

export interface ResumenPrestamo {
  montoTotal: number // capital + intereses (= saldo_pendiente inicial)
  interesTotal: number
  cuota: number
}

/**
 * Calcula el total a cobrar y la cuota de un préstamo.
 * - flat: la tasa es el interés TOTAL del préstamo (una sola vez sobre el capital).
 * - sobre_saldo: la tasa es MENSUAL y se prorratea al período, aplicada sobre el saldo decreciente.
 */
export function calcularPrestamo(
  capital: number,
  tasa: number,
  modelo: ModeloInteres,
  numCuotas: number,
  frecuencia: Frecuencia = 'mensual',
): ResumenPrestamo {
  if (numCuotas <= 0) return { montoTotal: capital, interesTotal: 0, cuota: capital }

  // Suma del interés de cada cuota (misma fórmula que el calendario y la próxima cuota).
  let interesTotal = 0
  for (let i = 0; i < numCuotas; i++) {
    interesTotal += interesDeCuota(capital, tasa, modelo, numCuotas, frecuencia, i)
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

export type TipoPagoApp = 'cuota_completa' | 'parcial' | 'solo_interes' | 'abono_capital'

export interface ItemCalendario {
  numero: number
  fecha: string
  monto: number
  pagada: boolean
}

/** Calendario completo de cuotas de un préstamo (fecha, monto, si está pagada). */
export function calendarioPrestamo(p: {
  monto_capital: number
  tasa_interes: number
  modelo_interes: string
  frecuencia_cobro: string
  num_cuotas: number
  cuotas_pagadas: number
  fecha_inicio: string
}): ItemCalendario[] {
  const capital = Number(p.monto_capital)
  const n = p.num_cuotas
  const tasa = Number(p.tasa_interes)
  const frecuencia = p.frecuencia_cobro as Frecuencia
  const modelo = p.modelo_interes as ModeloInteres
  const capCuota = n > 0 ? capital / n : capital
  const base = new Date(p.fecha_inicio)
  const out: ItemCalendario[] = []
  for (let i = 1; i <= n; i++) {
    const d = new Date(base)
    if (frecuencia === 'mensual') d.setMonth(d.getMonth() + i)
    else d.setDate(d.getDate() + (DIAS_POR_FRECUENCIA[frecuencia] ?? 30) * i)
    const interes = interesDeCuota(capital, tasa, modelo, n, frecuencia, i - 1)
    out.push({ numero: i, fecha: d.toISOString().slice(0, 10), monto: capCuota + interes, pagada: i <= p.cuotas_pagadas })
  }
  return out
}

export interface DatosCuota {
  capital: number
  tasa: number
  modelo: ModeloInteres
  numCuotas: number
  frecuencia: Frecuencia
  cuotasPagadas: number
}

/** Capital que corresponde a una cuota (capital / nº de cuotas). */
export function capitalDeCuota(capital: number, numCuotas: number): number {
  return numCuotas > 0 ? capital / numCuotas : capital
}

/**
 * Interés de la PRÓXIMA cuota.
 * - flat: interés total / nº de cuotas (constante).
 * - sobre_saldo: tasa mensual prorrateada sobre el CAPITAL restante (decrece cada cuota).
 */
export function interesDeProximaCuota(d: DatosCuota): number {
  return interesDeCuota(d.capital, d.tasa, d.modelo, d.numCuotas, d.frecuencia, d.cuotasPagadas)
}

/**
 * Desglosa un pago para insertar en `pagos` según el tipo.
 * Los triggers de la BD actualizan saldo del préstamo, score del cliente y caja.
 */
export function desglosarPago(params: {
  saldoAntes: number
  tipo: TipoPagoApp
  intCuota: number
  capCuota: number
  montoIngresado?: number
  mora?: number
}): DesglosePago & { tipo_pago: TipoPagoApp } {
  const { saldoAntes, tipo, intCuota, capCuota } = params
  const mora = params.mora ?? 0
  const ingresado = params.montoIngresado ?? 0

  let cap = 0
  let int = 0
  switch (tipo) {
    case 'cuota_completa':
      cap = capCuota
      int = intCuota
      break
    case 'solo_interes':
      int = intCuota
      break
    case 'abono_capital':
      cap = ingresado
      break
    case 'parcial':
      int = Math.min(ingresado, intCuota)
      cap = Math.max(ingresado - int, 0)
      break
  }
  const aplicadoAlSaldo = Math.min(cap + int, saldoAntes)
  return {
    tipo_pago: tipo,
    monto_total: aplicadoAlSaldo + mora,
    monto_capital: cap,
    monto_interes: int,
    monto_mora: mora,
    saldo_antes: saldoAntes,
    saldo_despues: Math.max(saldoAntes - aplicadoAlSaldo, 0),
  }
}

export interface ConfigMora {
  aplica_mora: boolean
  tipo_mora: string | null
  valor_mora: number | null
  dias_gracia: number
  mora_maxima: number | null
  aplica_mora_sobre: string
}

/**
 * Calcula la mora sugerida según la configuración de la cartera y los días de atraso.
 * El prestamista puede sobrescribir el resultado en la pantalla de pago.
 */
export function calcularMora(
  config: ConfigMora | null,
  diasAtraso: number,
  bases: { saldo: number; capital: number; cuota: number },
): number {
  if (!config || !config.aplica_mora) return 0
  const diasEfectivos = Math.max(diasAtraso - (config.dias_gracia || 0), 0)
  if (diasEfectivos <= 0) return 0

  const valor = Number(config.valor_mora || 0)
  const base =
    config.aplica_mora_sobre === 'monto_original'
      ? bases.capital
      : config.aplica_mora_sobre === 'cuota'
        ? bases.cuota
        : bases.saldo

  let mora = 0
  switch (config.tipo_mora) {
    case 'porcentaje_diario':
      mora = base * (valor / 100) * diasEfectivos
      break
    case 'porcentaje_semanal':
      mora = base * (valor / 100) * Math.ceil(diasEfectivos / 7)
      break
    case 'monto_fijo':
      mora = valor
      break
  }
  if (config.mora_maxima != null) mora = Math.min(mora, Number(config.mora_maxima))
  return Math.round(mora * 100) / 100
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
