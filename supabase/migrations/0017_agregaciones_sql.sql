-- Mueve las agregaciones del cliente al servidor (escala mejor con muchos datos).
-- SECURITY INVOKER: respeta RLS (cada quien solo ve lo suyo).

create or replace function public.metricas_cartera(p_cartera uuid)
returns table(
  capital_en_calle numeric,
  total_prestado numeric,
  clientes_activos bigint,
  prestamos_en_mora bigint
)
language sql stable security invoker set search_path to 'public' as $$
  select
    coalesce(sum(saldo_pendiente) filter (where estado in ('activo','en_mora')), 0),
    coalesce(sum(monto_capital)   filter (where estado in ('activo','en_mora')), 0),
    count(distinct cliente_id)     filter (where estado in ('activo','en_mora')),
    count(*)                       filter (where estado = 'en_mora')
  from prestamos
  where cartera_id = p_cartera and deleted_at is null;
$$;
revoke execute on function public.metricas_cartera(uuid) from anon;
grant execute on function public.metricas_cartera(uuid) to authenticated;

create or replace function public.reporte_cartera(p_cartera uuid)
returns jsonb
language sql stable security invoker set search_path to 'public' as $$
  with p as (
    select * from prestamos where cartera_id = p_cartera and deleted_at is null
  ), c as (
    select * from caja where cartera_id = p_cartera and deleted_at is null
  )
  select jsonb_build_object(
    'total_prestado',      coalesce((select sum(monto_capital) from p), 0),
    'capital_en_calle',    coalesce((select sum(saldo_pendiente) from p where estado in ('activo','en_mora')), 0),
    'intereses_generados', coalesce((select sum(total_intereses_generados) from p), 0),
    'mora_generada',       coalesce((select sum(total_mora_generada) from p), 0),
    'total_cobrado',       coalesce((select sum(monto) from c where tipo = 'entrada' and categoria in ('cobro','cobro_mora')), 0),
    'clientes',            (select count(distinct cliente_id) from p),
    'por_estado',          coalesce((select jsonb_object_agg(estado, n) from (select estado, count(*) n from p group by estado) s), '{}'::jsonb)
  );
$$;
revoke execute on function public.reporte_cartera(uuid) from anon;
grant execute on function public.reporte_cartera(uuid) to authenticated;
