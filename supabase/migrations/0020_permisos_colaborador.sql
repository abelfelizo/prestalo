-- Permisos por colaborador: el DUEÑO decide qué puede hacer cada cobrador.
-- Permisos delegables: pagos, clientes, prestamos, caja.
-- Acciones NO delegables (siempre solo dueño): borrar registros, anular pagos,
-- configuración de mora, herederos y gestión de carteras.

alter table public.cartera_colaboradores add column if not exists permisos jsonb not null default '{"pagos": true}'::jsonb;
update public.cartera_colaboradores set permisos = '{"pagos": true}'::jsonb where permisos = '{}'::jsonb;

create or replace function public.colab_puede(cid uuid, accion text) returns boolean
 language sql stable security definer set search_path=public as $$
  select coalesce((select (permisos->>accion)::boolean from cartera_colaboradores
                   where cartera_id = cid and user_id = auth.uid()), false);
$$;
revoke execute on function public.colab_puede(uuid, text) from anon;

create or replace function public.colab_puede_prestamo(pid uuid, accion text) returns boolean
 language sql stable security definer set search_path=public as $$
  select coalesce((select (cc.permisos->>accion)::boolean
                   from prestamos p join cartera_colaboradores cc on cc.cartera_id = p.cartera_id
                   where p.id = pid and cc.user_id = auth.uid()), false);
$$;
revoke execute on function public.colab_puede_prestamo(uuid, text) from anon;

create or replace function public.mis_permisos_cartera(p_cartera uuid) returns jsonb
 language plpgsql stable security definer set search_path=public as $$
begin
  if soy_dueno_cartera(p_cartera) then
    return '{"dueno":true,"pagos":true,"clientes":true,"prestamos":true,"caja":true}'::jsonb;
  end if;
  return coalesce((select permisos from cartera_colaboradores
                   where cartera_id = p_cartera and user_id = auth.uid()), '{}'::jsonb);
end; $$;
revoke execute on function public.mis_permisos_cartera(uuid) from anon;
grant execute on function public.mis_permisos_cartera(uuid) to authenticated;

create or replace function public.set_permisos_colaborador(p_cartera uuid, p_user uuid, p_permisos jsonb) returns void
 language plpgsql security definer set search_path=public as $$
begin
  if not soy_dueno_cartera(p_cartera) then raise exception 'No autorizado'; end if;
  update cartera_colaboradores set permisos = p_permisos
  where cartera_id = p_cartera and user_id = p_user;
end; $$;
revoke execute on function public.set_permisos_colaborador(uuid, uuid, jsonb) from anon;
grant execute on function public.set_permisos_colaborador(uuid, uuid, jsonb) to authenticated;

-- Políticas: escritura = dueño O permiso del colaborador. Borrado = solo dueño (de 0019).
drop policy if exists clientes_ins on public.clientes;
drop policy if exists clientes_upd on public.clientes;
create policy clientes_ins on public.clientes for insert
  with check (soy_dueno_cartera(cartera_id) or colab_puede(cartera_id,'clientes'));
create policy clientes_upd on public.clientes for update
  using (soy_dueno_cartera(cartera_id) or colab_puede(cartera_id,'clientes'))
  with check (soy_dueno_cartera(cartera_id) or colab_puede(cartera_id,'clientes'));

drop policy if exists prestamos_ins on public.prestamos;
drop policy if exists prestamos_upd on public.prestamos;
create policy prestamos_ins on public.prestamos for insert
  with check (soy_dueno_cartera(cartera_id) or colab_puede(cartera_id,'prestamos'));
create policy prestamos_upd on public.prestamos for update
  using (soy_dueno_cartera(cartera_id) or colab_puede(cartera_id,'prestamos'))
  with check (soy_dueno_cartera(cartera_id) or colab_puede(cartera_id,'prestamos'));

drop policy if exists caja_ins on public.caja;
drop policy if exists caja_upd on public.caja;
create policy caja_ins on public.caja for insert
  with check (soy_dueno_cartera(cartera_id) or colab_puede(cartera_id,'caja'));
create policy caja_upd on public.caja for update
  using (soy_dueno_cartera(cartera_id) or colab_puede(cartera_id,'caja'))
  with check (soy_dueno_cartera(cartera_id) or colab_puede(cartera_id,'caja'));

drop policy if exists pagos_ins on public.pagos;
create policy pagos_ins on public.pagos for insert
  with check (es_mi_prestamo(prestamo_id) or colab_puede_prestamo(prestamo_id,'pagos'));

drop policy if exists garantias_write on public.garantias;
create policy garantias_write on public.garantias for all
  using (es_mi_prestamo(prestamo_id) or colab_puede_prestamo(prestamo_id,'prestamos'))
  with check (es_mi_prestamo(prestamo_id) or colab_puede_prestamo(prestamo_id,'prestamos'));

drop function if exists public.colaboradores_de_cartera(uuid);
create function public.colaboradores_de_cartera(p_cartera uuid)
returns table(user_id uuid, email text, rol text, permisos jsonb)
language plpgsql security definer set search_path to 'public' as $$
begin
  if not soy_dueno_cartera(p_cartera) then raise exception 'No autorizado'; end if;
  return query
    select cc.user_id, u.email::text, cc.rol, cc.permisos
    from cartera_colaboradores cc
    join auth.users u on u.id = cc.user_id
    where cc.cartera_id = p_cartera;
end; $$;
revoke execute on function public.colaboradores_de_cartera(uuid) from anon;
grant execute on function public.colaboradores_de_cartera(uuid) to authenticated;
