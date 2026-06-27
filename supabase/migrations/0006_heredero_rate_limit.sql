-- Anti fuerza-bruta para el acceso de heredero: bloqueo tras 5 intentos fallidos (15 min).
-- (Ver el cuerpo completo de acceso_heredero aplicado vía MCP; tabla de intentos protegida con RLS.)
create table if not exists public.heredero_intentos (
  telefono text primary key,
  fallos int not null default 0,
  bloqueado_hasta timestamptz,
  ultimo_intento timestamptz not null default now()
);
alter table public.heredero_intentos enable row level security;
-- La función public.acceso_heredero valida bloqueo, cuenta fallos y limpia al acertar.
