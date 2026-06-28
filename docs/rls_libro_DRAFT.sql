-- ============================================================================
-- BORRADOR — RLS para las tablas libro_* (app "Libro", distinta de Kuotas)
-- ⚠️ NO APLICAR sin revisar. Cierra un hallazgo CRÍTICO de la auditoría:
--    hoy estas 8 tablas están SIN RLS y son accesibles con la anon key.
--
-- SUPUESTO CLAVE (verificar antes de aplicar): que `libro_vendedores.id = auth.uid()`,
-- es decir, que el vendedor se identifica con el usuario de Supabase Auth, igual que en
-- Kuotas (`prestamistas.id = auth.uid()`). NO hay FK que lo confirme. Si el mapeo
-- usuario→vendedor es distinto, ESTAS POLÍTICAS BLOQUEARÁN la app Libro. Probar en una
-- rama de Supabase antes de producción.
--
-- ALTERNATIVA RECOMENDADA: separar cada app a su propio proyecto Supabase.
-- ============================================================================

-- Helper para tablas hijas de deuda (cuotas, productos) sin recursión de RLS.
create or replace function public.libro_es_mi_deuda(did uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.libro_deudas d
    where d.id = did and d.vendedor_id = auth.uid()
  );
$$;
revoke execute on function public.libro_es_mi_deuda(uuid) from anon;

-- 1) Activar RLS
alter table public.libro_vendedores      enable row level security;
alter table public.libro_clientes        enable row level security;
alter table public.libro_deudas          enable row level security;
alter table public.libro_abonos          enable row level security;
alter table public.libro_herederos       enable row level security;
alter table public.libro_cuotas          enable row level security;
alter table public.libro_productos_deuda enable row level security;
alter table public.libro_transferencias  enable row level security;

-- 2) Políticas (cada vendedor solo ve/edita lo suyo)
create policy libro_vendedores_self on public.libro_vendedores
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy libro_clientes_owner on public.libro_clientes
  for all using (vendedor_id = auth.uid()) with check (vendedor_id = auth.uid());

create policy libro_deudas_owner on public.libro_deudas
  for all using (vendedor_id = auth.uid()) with check (vendedor_id = auth.uid());

create policy libro_abonos_owner on public.libro_abonos
  for all using (vendedor_id = auth.uid()) with check (vendedor_id = auth.uid());

create policy libro_herederos_owner on public.libro_herederos
  for all using (vendedor_id = auth.uid()) with check (vendedor_id = auth.uid());

create policy libro_cuotas_owner on public.libro_cuotas
  for all using (public.libro_es_mi_deuda(deuda_id)) with check (public.libro_es_mi_deuda(deuda_id));

create policy libro_productos_owner on public.libro_productos_deuda
  for all using (public.libro_es_mi_deuda(deuda_id)) with check (public.libro_es_mi_deuda(deuda_id));

create policy libro_transferencias_part on public.libro_transferencias
  for all using (vendedor_origen_id = auth.uid() or vendedor_destino_id = auth.uid())
  with check (vendedor_origen_id = auth.uid());

-- 3) OJO con flujos públicos: si la app Libro tiene acceso de heredero o transferencia por
--    clave (como Kuotas con acceso_heredero), esos deben ir por funciones SECURITY DEFINER
--    para seguir funcionando con RLS activo. Revisar antes de aplicar.
