/** Teléfono: entre 7 y 15 dígitos (ignorando separadores). */
export function telefonoValido(tel: string): boolean {
  const d = tel.replace(/\D/g, '')
  return d.length >= 7 && d.length <= 15
}

export function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function montoValido(v: string): boolean {
  const n = parseFloat(v)
  return Number.isFinite(n) && n > 0
}
