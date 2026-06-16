import { supabase } from '@/lib/supabase'
import type { ConfiguracionCartera, Inserts } from '@/types'

export async function getConfigCartera(carteraId: string): Promise<ConfiguracionCartera | null> {
  const { data, error } = await supabase
    .from('configuracion_cartera')
    .select('*')
    .eq('cartera_id', carteraId)
    .maybeSingle()
  if (error) throw error
  return data
}

/** Crea o actualiza la configuración de mora de la cartera. */
export async function guardarConfigCartera(input: Inserts<'configuracion_cartera'>): Promise<void> {
  const { error } = await supabase
    .from('configuracion_cartera')
    .upsert(input, { onConflict: 'cartera_id' })
  if (error) throw error
}
