-- RLS para las tablas de la app "Libro" (en desarrollo, 0 filas al aplicar).
-- Cierra el hallazgo CRÍTICO de la auditoría: estaban en el esquema público SIN RLS.
-- Solo activa RLS y crea políticas; no borra ni altera datos.
-- Modelo: el vendedor se identifica con auth.uid() (libro_vendedores.id = auth.uid()),
-- igual que prestamistas en Kuotas.

create or replace function public.libro_es_mi_deuda(did uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.libro_deudas d where d.id = did and d.vendedor_id = auth.uid());
$$;
revoke execute on function public.libro_es_mi_deuda(uuid) from anon;

alter table public.libro_vendedores      enable row level security;
alter table public.libro_clientes        enable row level security;
alter table public.libro_deudas          enable row level security;
alter table public.libro_abonos          enable row level security;
alter table public.libro_herederos       enable row level security;
alter table public.libro_cuotas          enable row level security;
alter table public.libro_productos_deuda enable row level security;
alter table public.libro_transferencias  enable row level security;

drop policy if exists libro_vendedores_self on public.libro_vendedores;
create policy libro_vendedores_self on public.libro_vendedores
  for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists libro_clientes_owner on public.libro_clientes;
create policy libro_clientes_owner on public.libro_clientes
  for all using (vendedor_id = auth.uid()) with check (vendedor_id = auth.uid());

drop policy if exists libro_deudas_owner on public.libro_deudas;
create policy libro_deudas_owner on public.libro_deudas
  for all using (vendedor_id = auth.uid()) with check (vendedor_id = auth.uid());

drop policy if exists libro_abonos_owner on public.libro_abonos;
create policy libro_abonos_owner on public.libro_abonos
  for all using (vendedor_id = auth.uid()) with check (vendedor_id = auth.uid());

drop policy if exists libro_herederos_owner on public.libro_herederos;
create policy libro_herederos_owner on public.libro_herederos
  for all using (vendedor_id = auth.uid()) with check (vendedor_id = auth.uid());

drop policy if exists libro_cuotas_owner on public.libro_cuotas;
create policy libro_cuotas_owner on public.libro_cuotas
  for all using (public.libro_es_mi_deuda(deuda_id)) with check (public.libro_es_mi_deuda(deuda_id));

drop policy if exists libro_productos_owner on public.libro_productos_deuda;
create policy libro_productos_owner on public.libro_productos_deuda
  for all using (public.libro_es_mi_deuda(deuda_id)) with check (public.libro_es_mi_deuda(deuda_id));

drop policy if exists libro_transferencias_part on public.libro_transferencias;
create policy libro_transferencias_part on public.libro_transferencias
  for all using (vendedor_origen_id = auth.uid() or vendedor_destino_id = auth.uid())
  with check (vendedor_origen_id = auth.uid());

-- Endurecer search_path de las funciones de Libro.
alter function public.libro_set_updated_at() set search_path = public;
alter function public.libro_actualizar_deuda_tras_abono() set search_path = public;
alter function public.libro_actualizar_cuota_tras_abono() set search_path = public;
