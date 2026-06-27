import { supabase } from '@/lib/supabase'

const BUCKET = 'garantias'
const EXPIRA_SEG = 60 * 60 // 1h

/**
 * Sube una imagen local (uri) al bucket privado y devuelve su RUTA (no la URL).
 * La foto se guarda en una carpeta por préstamo para que solo el dueño/colaborador
 * de ese préstamo pueda verla (lo impone la política RLS de storage).
 */
export async function subirFotoGarantia(uri: string, prestamoId: string): Promise<string> {
  const res = await fetch(uri)
  const arrayBuffer = await res.arrayBuffer()
  const ext = (uri.split('.').pop() || 'jpg').toLowerCase().split('?')[0]
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg'
  const path = `${prestamoId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, arrayBuffer, { contentType, upsert: false })
  if (error) throw error
  return path
}

/** Genera una URL firmada temporal para una ruta del bucket privado. */
export async function firmarUrl(path: string): Promise<string | null> {
  if (path.startsWith('http')) return path // compat con datos viejos (URLs públicas)
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, EXPIRA_SEG)
  if (error) return null
  return data.signedUrl
}

/** Firma varias rutas; descarta las que fallen. */
export async function firmarUrls(paths: string[]): Promise<string[]> {
  const urls = await Promise.all(paths.map((p) => firmarUrl(p)))
  return urls.filter((u): u is string => !!u)
}
