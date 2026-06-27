-- Refinanciamiento atómico: crea el préstamo nuevo y cierra el viejo en una sola
-- transacción. Si algo falla, no queda el nuevo y el viejo activo (doble conteo).
-- SECURITY INVOKER: respeta RLS (el usuario solo refinancia préstamos de su cartera).
create or replace function public.refinanciar_prestamo(
  p_viejo uuid,
  p_capital numeric,
  p_tasa numeric,
  p_modelo text,
  p_frecuencia text,
  p_num_cuotas int,
  p_saldo_pendiente numeric,
  p_fecha_inicio date,
  p_fecha_proximo date,
  p_client_op_id uuid default null
) returns uuid
  language plpgsql
  security invoker
  set search_path to 'public'
as $function$
declare
  v_cartera uuid;
  v_cliente uuid;
  v_nuevo uuid;
begin
  select cartera_id, cliente_id into v_cartera, v_cliente
  from prestamos where id = p_viejo;
  if v_cartera is null then
    raise exception 'Préstamo no encontrado';
  end if;

  -- Idempotencia: si este refinanciamiento ya se hizo, devolver el préstamo nuevo existente.
  if p_client_op_id is not null then
    select id into v_nuevo from prestamos where client_op_id = p_client_op_id;
    if v_nuevo is not null then return v_nuevo; end if;
  end if;

  insert into prestamos (
    cartera_id, cliente_id, prestamo_padre_id, monto_capital, saldo_pendiente,
    tasa_interes, modelo_interes, frecuencia_cobro, num_cuotas,
    fecha_inicio, fecha_proximo_pago, estado, client_op_id
  ) values (
    v_cartera, v_cliente, p_viejo, p_capital, p_saldo_pendiente,
    p_tasa, p_modelo, p_frecuencia, p_num_cuotas,
    p_fecha_inicio, p_fecha_proximo, 'activo', p_client_op_id
  ) returning id into v_nuevo;

  update prestamos set estado = 'refinanciado', updated_at = now() where id = p_viejo;
  return v_nuevo;
end;
$function$;

revoke execute on function public.refinanciar_prestamo(uuid,numeric,numeric,text,text,int,numeric,date,date,uuid) from anon;
grant execute on function public.refinanciar_prestamo(uuid,numeric,numeric,text,text,int,numeric,date,date,uuid) to authenticated;
