import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

// Borra la cuenta del usuario autenticado: primero sus datos (RPC como el propio
// usuario), luego su usuario de Auth (con service role). Cumple el requisito de
// borrado de cuenta in-app de Apple y Google.
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
    })
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json({ error: 'No autenticado' }, 401)

  const url = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // Cliente con la sesión del usuario para identificarlo y borrar SUS datos.
  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user }, error: userErr } = await userClient.auth.getUser()
  if (userErr || !user) return json({ error: 'Sesión inválida' }, 401)

  // 1. Borrar todos los datos del prestamista (RPC SECURITY DEFINER, corre como el usuario).
  const { error: rpcErr } = await userClient.rpc('eliminar_mi_cuenta')
  if (rpcErr) return json({ error: 'No se pudieron borrar los datos', detail: rpcErr.message }, 500)

  // 2. Borrar el usuario de Auth (requiere service role).
  const admin = createClient(url, serviceKey)
  const { error: delErr } = await admin.auth.admin.deleteUser(user.id)
  if (delErr) return json({ error: 'No se pudo borrar la cuenta', detail: delErr.message }, 500)

  return json({ ok: true })
})
