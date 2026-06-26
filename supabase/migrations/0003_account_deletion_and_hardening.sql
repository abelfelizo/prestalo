-- Kuotas — borrado de cuenta (requisito de tiendas) + endurecimiento de seguridad.

-- 1. Borra TODOS los datos del prestamista autenticado.
create or replace function public.eliminar_mi_cuenta()
returns void language plpgsql security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'no autenticado'; end if;
  delete from pagos where prestamo_id in (
    select id from prestamos where cartera_id in (select id from carteras where prestamista_id = uid));
  delete from garantias where prestamo_id in (
    select id from prestamos where cartera_id in (select id from carteras where prestamista_id = uid));
  delete from prestamos where cartera_id in (select id from carteras where prestamista_id = uid);
  delete from clientes where cartera_id in (select id from carteras where prestamista_id = uid);
  delete from caja where cartera_id in (select id from carteras where prestamista_id = uid);
  delete from configuracion_cartera where cartera_id in (select id from carteras where prestamista_id = uid);
  delete from cartera_colaboradores where cartera_id in (select id from carteras where prestamista_id = uid);
  delete from alertas where prestamista_id = uid;
  delete from herederos where prestamista_id = uid;
  delete from carteras where prestamista_id = uid;
  delete from prestamistas where id = uid;
end; $$;
revoke execute on function public.eliminar_mi_cuenta() from anon;
grant execute on function public.eliminar_mi_cuenta() to authenticated;

-- 2. Fijar search_path en funciones de negocio/trigger.
alter function public.set_updated_at() set search_path = public;
alter function public.actualizar_fecha_proximo_pago() set search_path = public;
alter function public.actualizar_tras_pago() set search_path = public;
alter function public.registrar_desembolso_caja() set search_path = public;
alter function public.registrar_cobro_caja() set search_path = public;

-- 3. Revocar EXECUTE a anon en funciones internas (acceso_heredero queda público a propósito).
revoke execute on function public.es_colaborador(uuid) from anon;
revoke execute on function public.soy_dueno_cartera(uuid) from anon;
revoke execute on function public.anular_pago(uuid) from anon;
revoke execute on function public.invitar_colaborador(uuid, text) from anon;
revoke execute on function public.marcar_vencidos() from anon;
