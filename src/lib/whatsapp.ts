import { Linking } from 'react-native'

/**
 * Abre WhatsApp con un recordatorio de cobro.
 * Si se pasa `plantilla` (de configuracion_cartera.mensaje_mora_whatsapp), se usa esa,
 * reemplazando {nombre} y {monto}.
 */
export function cobrarPorWhatsApp(
  telefono: string,
  nombre: string,
  monto: number,
  moneda: string,
  plantilla?: string | null,
) {
  const num = telefono.replace(/\D/g, '')
  const montoStr = `${moneda} ${monto.toLocaleString()}`
  const texto = plantilla?.trim()
    ? plantilla.replace(/\{nombre\}/g, nombre).replace(/\{monto\}/g, montoStr)
    : `Hola ${nombre}, le recordamos que tiene un pago pendiente de ${montoStr}. Por favor coordine su pago. Gracias.`
  const msg = encodeURIComponent(texto)
  Linking.openURL(`whatsapp://send?phone=${num}&text=${msg}`)
    .catch(() => Linking.openURL(`https://wa.me/${num}?text=${msg}`))
}

export function enviarComprobante(telefono: string, nombre: string, monto: number, moneda: string) {
  const num = telefono.replace(/\D/g, '')
  const fecha = new Date().toLocaleDateString('es-DO')
  const msg = encodeURIComponent(`✅ Comprobante de pago\nCliente: ${nombre}\nMonto: ${moneda} ${monto.toLocaleString()}\nFecha: ${fecha}\nGracias por su pago.`)
  Linking.openURL(`whatsapp://send?phone=${num}&text=${msg}`)
    .catch(() => Linking.openURL(`https://wa.me/${num}?text=${msg}`))
}
