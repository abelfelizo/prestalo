-- Gestión de colaboradores: ver quién tiene acceso y revocarlo. Solo el dueño de la cartera.
create or replace function public.colaboradores_de_cartera(p_cartera uuid)
returns table(user_id uuid, email text, rol text)
language plpgsql security definer set search_path to 'public' as $$
begin
  if not soy_dueno_cartera(p_cartera) then raise exception 'No autorizado'; end if;
  return query
    select cc.user_id, u.email::text, cc.rol
    from cartera_colaboradores cc
    join auth.users u on u.id = cc.user_id
    where cc.cartera_id = p_cartera;
end; $$;
revoke execute on function public.colaboradores_de_cartera(uuid) from anon;
grant execute on function public.colaboradores_de_cartera(uuid) to authenticated;

create or replace function public.revocar_colaborador(p_cartera uuid, p_user uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if not soy_dueno_cartera(p_cartera) then raise exception 'No autorizado'; end if;
  delete from cartera_colaboradores where cartera_id = p_cartera and user_id = p_user;
end; $$;
revoke execute on function public.revocar_colaborador(uuid, uuid) from anon;
grant execute on function public.revocar_colaborador(uuid, uuid) to authenticated;
