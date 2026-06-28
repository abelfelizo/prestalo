import { supabase } from '@/lib/supabase'
import * as Linking from 'expo-linking'
import type { Session, User } from '@supabase/supabase-js'

export interface AuthResult {
  user: User | null
  session: Session | null
}

export async function signUp(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw error
  return { user: data.user, session: data.session }
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return { user: data.user, session: data.session }
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getUsuarioActual(): Promise<User | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.user ?? null
}

/** Envía un correo para restablecer la contraseña (recuperación de cuenta). */
export async function enviarResetPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: Linking.createURL('/reset-password'),
  })
  if (error) throw error
}

/** Cambia la contraseña del usuario autenticado. */
export async function actualizarPassword(nueva: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: nueva })
  if (error) throw error
}

/** Cambia el correo (Supabase envía verificación al nuevo correo antes de aplicarlo). */
export async function actualizarEmail(nuevo: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ email: nuevo.trim() })
  if (error) throw error
}

/** Reenvía el correo de confirmación de registro. */
export async function reenviarConfirmacion(email: string): Promise<void> {
  const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() })
  if (error) throw error
}

/**
 * Borra permanentemente la cuenta y TODOS sus datos (requisito de Apple/Google).
 * Llama a la edge function `eliminar-cuenta`, que borra los datos y el usuario de Auth.
 */
export async function eliminarCuenta(): Promise<void> {
  const { error } = await supabase.functions.invoke('eliminar-cuenta', { method: 'POST' })
  if (error) throw error
  await supabase.auth.signOut().catch(() => {})
}
