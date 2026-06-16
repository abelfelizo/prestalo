import { Linking } from 'react-native'

export function cobrarPorWhatsApp(telefono: string, nombre: string, monto: number, moneda: string) {
  const num = telefono.replace(/\D/g, '')
  const msg = encodeURIComponent(`Hola ${nombre}, le recordamos que tiene un pago pendiente de ${moneda} ${monto.toLocaleString()}. Por favor coordine su pago. Gracias.`)
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
