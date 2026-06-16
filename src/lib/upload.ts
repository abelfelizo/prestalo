import { supabase } from '@/lib/supabase'

/** Sube una imagen local (uri) al bucket 'garantias' y devuelve su URL pública. */
export async function subirFotoGarantia(uri: string): Promise<string> {
  const res = await fetch(uri)
  const arrayBuffer = await res.arrayBuffer()
  const ext = (uri.split('.').pop() || 'jpg').toLowerCase().split('?')[0]
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg'
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error } = await supabase.storage
    .from('garantias')
    .upload(path, arrayBuffer, { contentType, upsert: false })
  if (error) throw error

  const { data } = supabase.storage.from('garantias').getPublicUrl(path)
  return data.publicUrl
}
