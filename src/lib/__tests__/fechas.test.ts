import {
  interesDeCuota,
  parseFechaLocal,
  fechaLocalISO,
  hoyLocalISO,
  diasMora,
  calendarioPrestamo,
} from '@/lib/calculos'

describe('interesDeCuota (fórmula única)', () => {
  it('flat es constante por cuota', () => {
    expect(interesDeCuota(10000, 10, 'flat', 4, 'semanal', 0)).toBe(250)
    expect(interesDeCuota(10000, 10, 'flat', 4, 'semanal', 3)).toBe(250)
  })

  it('sobre_saldo decrece con las cuotas pagadas', () => {
    expect(interesDeCuota(20000, 10, 'sobre_saldo', 4, 'mensual', 0)).toBe(2000)
    expect(interesDeCuota(20000, 10, 'sobre_saldo', 4, 'mensual', 1)).toBe(1500)
    expect(interesDeCuota(20000, 10, 'sobre_saldo', 4, 'mensual', 3)).toBe(500)
  })
})

describe('helpers de fecha local (sin desfase UTC)', () => {
  it('round-trip parse/format', () => {
    expect(fechaLocalISO(parseFechaLocal('2026-01-01'))).toBe('2026-01-01')
    expect(fechaLocalISO(parseFechaLocal('2026-12-31'))).toBe('2026-12-31')
  })

  it('parseFechaLocal construye fecha local a medianoche (no UTC)', () => {
    const d = parseFechaLocal('2026-03-15')
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(2) // marzo (0-based)
    expect(d.getDate()).toBe(15)
    expect(d.getHours()).toBe(0)
  })

  it('hoyLocalISO tiene formato YYYY-MM-DD', () => {
    expect(hoyLocalISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('diasMora cuenta días exactos sin desfase', () => {
    const hace3 = fechaLocalISO(new Date(Date.now() - 3 * 86_400_000))
    expect(diasMora(hace3)).toBe(3)
    const futuro = fechaLocalISO(new Date(Date.now() + 5 * 86_400_000))
    expect(diasMora(futuro)).toBe(0)
  })

  it('calendarioPrestamo genera fechas locales correctas (semanal)', () => {
    const cal = calendarioPrestamo({
      monto_capital: 10000, tasa_interes: 10, modelo_interes: 'flat',
      frecuencia_cobro: 'semanal', num_cuotas: 2, cuotas_pagadas: 0, fecha_inicio: '2026-01-01',
    })
    expect(cal[0].fecha).toBe('2026-01-08')
    expect(cal[1].fecha).toBe('2026-01-15')
  })
})
