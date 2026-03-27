export function calcularPrestamo(principal: number, tasa: number, plazo: number, tipo: 'flat' | 'sobre_saldo') {
  if (tipo === 'flat') {
    const interes = principal * (tasa / 100) * plazo
    const total = principal + interes
    return { total, interes, cuota: total / plazo }
  }
  let saldo = principal, totalInteres = 0
  for (let i = 0; i < plazo; i++) {
    totalInteres += saldo * (tasa / 100)
    saldo -= principal / plazo
  }
  const total = principal + totalInteres
  return { total, interes: totalInteres, cuota: total / plazo }
}

export function diasMora(fechaVencimiento: string): number {
  const hoy = new Date(), vence = new Date(fechaVencimiento)
  if (hoy <= vence) return 0
  return Math.floor((hoy.getTime() - vence.getTime()) / 86400000)
}

export function fmt(monto: number, moneda = 'RD$'): string {
  return `${moneda} ${monto.toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
