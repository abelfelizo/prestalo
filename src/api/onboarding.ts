import { supabase } from '@/lib/supabase'
import type { Cartera, ColorCartera, MetodoSeguridad } from '@/types'

export interface OnboardingInput {
  userId: string
  nombre: string
  moneda: string
  pinHash: string
  metodoSeguridad: MetodoSeguridad
  nombreCartera: string
  color: ColorCartera
}

/** Crea el prestamista (id = auth.uid()) y su primera cartera. Deja la cartera como activa. */
export async function completarOnboarding(i: OnboardingInput): Promise<Cartera> {
  const { error: pe } = await supabase.from('prestamistas').insert({
    id: i.userId,
    nombre: i.nombre,
    moneda_principal: i.moneda,
    pin_hash: i.pinHash,
    metodo_seguridad: i.metodoSeguridad,
  })
  if (pe) throw pe

  const { data: cartera, error: ce } = await supabase
    .from('carteras')
    .insert({
      prestamista_id: i.userId,
      nombre: i.nombreCartera,
      moneda: i.moneda,
      color: i.color,
      capital_inicial: 0,
      activa: true,
    })
    .select()
    .single()
  if (ce) throw ce

  await supabase.from('prestamistas').update({ cartera_activa_id: cartera.id }).eq('id', i.userId)
  return cartera
}
