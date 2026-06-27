/**
 * Convierte cualquier error en un mensaje seguro para mostrar al usuario.
 * Registra el error completo SOLO en consola (logs del dispositivo), nunca en pantalla,
 * para no filtrar detalles internos de la base de datos (punto 11 del checklist de seguridad).
 *
 * Uso: Alert.alert('Error', errMsg(e, 'No se pudo guardar el cliente'))
 * El `fallback` es el mensaje contextual que se muestra si el error no es uno conocido.
 */
export function errMsg(e: unknown, fallback = 'Algo salió mal. Inténtalo de nuevo.'): string {
  // Log completo para depuración (no visible para el usuario).
  console.error('[Kuotas]', e)

  const m = String((e as any)?.message ?? '').toLowerCase()
  if (!m) return fallback

  if (m.includes('network') || m.includes('fetch') || m.includes('failed to') || m.includes('timeout')) {
    return 'Sin conexión. Revisa tu internet e inténtalo de nuevo.'
  }
  if (m.includes('intentos')) {
    return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'
  }
  if (m.includes('invalid login') || m.includes('invalid credentials')) {
    return 'Correo o contraseña incorrectos.'
  }
  if (m.includes('not confirmed') || m.includes('email not confirmed')) {
    return 'Tu correo aún no está confirmado. Revisa tu email.'
  }
  if (m.includes('already registered') || m.includes('already exists') || m.includes('duplicate')) {
    return 'Ese registro ya existe.'
  }
  if (m.includes('row-level security') || m.includes('permission') || m.includes('not allowed') || m.includes('policy')) {
    return 'No tienes permiso para esta acción.'
  }
  if (m.includes('jwt') || m.includes('token') || (m.includes('session') && m.includes('expired'))) {
    return 'Tu sesión expiró. Inicia sesión de nuevo.'
  }
  // Cualquier otro error: mensaje contextual genérico, sin exponer el detalle crudo.
  return fallback
}
