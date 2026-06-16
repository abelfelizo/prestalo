-- ============================================================
-- Préstalo v2 — F0: ligar prestamistas a Supabase Auth + activar RLS
-- Seguro de aplicar: todas las tablas tienen 0 filas.
-- Solo afecta tablas de Préstalo (NO toca libro_* ni turno_*).
-- ============================================================

-- 1. Ligar prestamistas.id -> auth.users(id)
alter table public.prestamistas
  add constraint prestamistas_id_fkey
  foreign key (id) references auth.users(id) on delete cascade;

-- 2. Helpers de propiedad (SECURITY DEFINER para no recursar en RLS)
create or replace function public.es_mi_cartera(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.carteras c
                 where c.id = cid and c.prestamista_id = auth.uid());
$$;

create or replace function public.es_mi_prestamo(pid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.prestamos p
    join public.carteras c on c.id = p.cartera_id
    where p.id = pid and c.prestamista_id = auth.uid()
  );
$$;

-- 3. Activar RLS
alter table public.prestamistas          enable row level security;
alter table public.carteras              enable row level security;
alter table public.clientes              enable row level security;
alter table public.prestamos             enable row level security;
alter table public.pagos                 enable row level security;
alter table public.caja                  enable row level security;
alter table public.garantias             enable row level security;
alter table public.herederos             enable row level security;
alter table public.alertas               enable row level security;
alter table public.configuracion_cartera enable row level security;

-- 4. Políticas (cada prestamista solo accede a lo suyo)
create policy prestamistas_self on public.prestamistas
  for all using (id = auth.uid()) with check (id = auth.uid());

create policy carteras_owner on public.carteras
  for all using (prestamista_id = auth.uid()) with check (prestamista_id = auth.uid());

create policy clientes_owner on public.clientes
  for all using (public.es_mi_cartera(cartera_id)) with check (public.es_mi_cartera(cartera_id));

create policy prestamos_owner on public.prestamos
  for all using (public.es_mi_cartera(cartera_id)) with check (public.es_mi_cartera(cartera_id));

create policy caja_owner on public.caja
  for all using (public.es_mi_cartera(cartera_id)) with check (public.es_mi_cartera(cartera_id));

create policy config_owner on public.configuracion_cartera
  for all using (public.es_mi_cartera(cartera_id)) with check (public.es_mi_cartera(cartera_id));

create policy pagos_owner on public.pagos
  for all using (public.es_mi_prestamo(prestamo_id)) with check (public.es_mi_prestamo(prestamo_id));

create policy garantias_owner on public.garantias
  for all using (public.es_mi_prestamo(prestamo_id)) with check (public.es_mi_prestamo(prestamo_id));

create policy herederos_owner on public.herederos
  for all using (prestamista_id = auth.uid()) with check (prestamista_id = auth.uid());

create policy alertas_owner on public.alertas
  for all using (prestamista_id = auth.uid()) with check (prestamista_id = auth.uid());

-- 5. Endurecer: los helpers solo se usan dentro de políticas RLS, no como RPC público
revoke execute on function public.es_mi_cartera(uuid) from anon, authenticated;
revoke execute on function public.es_mi_prestamo(uuid) from anon, authenticated;
