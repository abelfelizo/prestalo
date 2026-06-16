import { supabase } from '@/lib/supabase'
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
