import {
  calcularPrestamo,
  capitalDeCuota,
  interesDeProximaCuota,
  desglosarPago,
  calcularMora,
  diasMora,
  fmt,
  calendarioPrestamo,
} from '@/lib/calculos'

describe('calcularPrestamo', () => {
  it('flat: interés total = capital × tasa% (una vez)', () => {
    const r = calcularPrestamo(10000, 10, 'flat', 4, 'semanal')
    expect(r.interesTotal).toBe(1000)
    expect(r.montoTotal).toBe(11000)
    expect(r.cuota).toBe(2750)
  })

  it('sobre_saldo mensual: interés decreciente sobre el saldo', () => {
    const r = calcularPrestamo(20000, 10, 'sobre_saldo', 4, 'mensual')
    // 2000 + 1500 + 1000 + 500 = 5000
    expect(r.interesTotal).toBe(5000)
    expect(r.montoTotal).toBe(25000)
  })

  it('numCuotas 0 no rompe', () => {
    const r = calcularPrestamo(5000, 10, 'flat', 0, 'semanal')
    expect(r.montoTotal).toBe(5000)
  })
})

describe('cuotas', () => {
  it('capitalDeCuota reparte el capital', () => {
    expect(capitalDeCuota(10000, 4)).toBe(2500)
  })

  it('interesDeProximaCuota flat es constante', () => {
    const i = interesDeProximaCuota({ capital: 10000, tasa: 10, modelo: 'flat', numCuotas: 4, frecuencia: 'semanal', cuotasPagadas: 0 })
    expect(i).toBe(250)
  })

  it('interesDeProximaCuota sobre_saldo decrece con cuotas pagadas', () => {
    const base = { capital: 20000, tasa: 10, modelo: 'sobre_saldo' as const, numCuotas: 4, frecuencia: 'mensual' as const }
    expect(interesDeProximaCuota({ ...base, cuotasPagadas: 0 })).toBe(2000)
    expect(interesDeProximaCuota({ ...base, cuotasPagadas: 1 })).toBe(1500)
    expect(interesDeProximaCuota({ ...base, cuotasPagadas: 3 })).toBe(500)
  })
})

describe('desglosarPago', () => {
  it('cuota_completa baja el saldo por capital+interés', () => {
    const d = desglosarPago({ saldoAntes: 11000, tipo: 'cuota_completa', capCuota: 2500, intCuota: 250 })
    expect(d.monto_total).toBe(2750)
    expect(d.saldo_despues).toBe(8250)
    expect(d.tipo_pago).toBe('cuota_completa')
  })

  it('parcial reparte interés primero luego capital', () => {
    const d = desglosarPago({ saldoAntes: 11000, tipo: 'parcial', capCuota: 2500, intCuota: 250, montoIngresado: 1000 })
    expect(d.monto_interes).toBe(250)
    expect(d.monto_capital).toBe(750)
    expect(d.saldo_despues).toBe(10000)
  })

  it('solo_interes no toca capital', () => {
    const d = desglosarPago({ saldoAntes: 11000, tipo: 'solo_interes', capCuota: 2500, intCuota: 250 })
    expect(d.monto_capital).toBe(0)
    expect(d.monto_interes).toBe(250)
  })

  it('mora se suma al total pero no baja el saldo', () => {
    const d = desglosarPago({ saldoAntes: 11000, tipo: 'cuota_completa', capCuota: 2500, intCuota: 250, mora: 100 })
    expect(d.monto_total).toBe(2850)
    expect(d.monto_mora).toBe(100)
    expect(d.saldo_despues).toBe(8250)
  })
})

describe('calcularMora', () => {
  const bases = { saldo: 10000, capital: 10000, cuota: 2750 }

  it('sin config o desactivada = 0', () => {
    expect(calcularMora(null, 10, bases)).toBe(0)
    expect(calcularMora({ aplica_mora: false, tipo_mora: 'porcentaje_diario', valor_mora: 1, dias_gracia: 0, mora_maxima: null, aplica_mora_sobre: 'saldo_pendiente' }, 10, bases)).toBe(0)
  })

  it('días de gracia descuentan', () => {
    const c = { aplica_mora: true, tipo_mora: 'porcentaje_diario', valor_mora: 1, dias_gracia: 5, mora_maxima: null, aplica_mora_sobre: 'saldo_pendiente' }
    expect(calcularMora(c, 5, bases)).toBe(0) // 5-5=0 días efectivos
    expect(calcularMora(c, 8, bases)).toBe(300) // 3 días × 1% × 10000
  })

  it('respeta el tope (mora_maxima)', () => {
    const c = { aplica_mora: true, tipo_mora: 'porcentaje_diario', valor_mora: 5, dias_gracia: 0, mora_maxima: 500, aplica_mora_sobre: 'saldo_pendiente' }
    expect(calcularMora(c, 30, bases)).toBe(500)
  })

  it('monto_fijo es el valor', () => {
    const c = { aplica_mora: true, tipo_mora: 'monto_fijo', valor_mora: 200, dias_gracia: 0, mora_maxima: null, aplica_mora_sobre: 'saldo_pendiente' }
    expect(calcularMora(c, 3, bases)).toBe(200)
  })
})

describe('calendarioPrestamo', () => {
  it('genera n cuotas y marca las pagadas', () => {
    const cal = calendarioPrestamo({
      monto_capital: 10000, tasa_interes: 10, modelo_interes: 'flat',
      frecuencia_cobro: 'semanal', num_cuotas: 4, cuotas_pagadas: 1, fecha_inicio: '2026-01-01',
    })
    expect(cal).toHaveLength(4)
    expect(cal[0].pagada).toBe(true)
    expect(cal[1].pagada).toBe(false)
    expect(cal[0].monto).toBe(2750)
  })
})

describe('helpers', () => {
  it('diasMora 0 si no ha vencido', () => {
    const futuro = new Date(Date.now() + 86400000 * 5).toISOString().slice(0, 10)
    expect(diasMora(futuro)).toBe(0)
    expect(diasMora(null)).toBe(0)
  })

  it('fmt formatea con moneda', () => {
    expect(fmt(1500, 'RD$')).toContain('RD$')
    expect(fmt(null)).toContain('0')
  })
})
