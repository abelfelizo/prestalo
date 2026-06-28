-- anular_pago endurecido:
--  (a) revierte fecha_proximo_pago (solo si este pago la había avanzado),
--  (b) solo permite anular el ÚLTIMO pago del préstamo (evita corromper el saldo),
--  (c) revierte veces_atrasado.
-- Nota: el score del cliente no se revierte de forma exacta (es acumulativo). Aceptable por ahora.
create or replace function public.anular_pago(p_pago_id uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
declare
  pg record;
  v_frecuencia text;
begin
  select * into pg from pagos where id = p_pago_id;
  if not found then raise exception 'Pago no encontrado'; end if;

  -- Propiedad
  if not exists (
    select 1 from prestamos p join carteras c on c.id = p.cartera_id
    where p.id = pg.prestamo_id and c.prestamista_id = auth.uid()
  ) then raise exception 'No autorizado'; end if;

  -- Solo se puede anular el ÚLTIMO pago del préstamo (evita corromper el saldo)
  if exists (
    select 1 from pagos
    where prestamo_id = pg.prestamo_id and created_at > pg.created_at
  ) then
    raise exception 'Solo puedes anular el último pago registrado de este préstamo.';
  end if;

  select frecuencia_cobro into v_frecuencia from prestamos where id = pg.prestamo_id;

  update prestamos set
    saldo_pendiente = pg.saldo_antes,
    total_intereses_generados = greatest(total_intereses_generados - pg.monto_interes, 0),
    total_mora_generada = greatest(total_mora_generada - pg.monto_mora, 0),
    cuotas_pagadas = case when pg.tipo_pago = 'cuota_completa'
                          then greatest(cuotas_pagadas - 1, 0) else cuotas_pagadas end,
    fecha_proximo_pago = case when pg.saldo_despues > 0 then
      pg.fecha_pago - case v_frecuencia
        when 'diario' then interval '1 day'
        when 'semanal' then interval '7 days'
        when 'quincenal' then interval '15 days'
        when 'mensual' then interval '1 month'
        else interval '1 month' end
      else fecha_proximo_pago end,
    estado = case when estado = 'cerrado' then 'activo' else estado end,
    updated_at = now()
  where id = pg.prestamo_id;

  update clientes set
    total_pagado = greatest(total_pagado - pg.monto_total, 0),
    veces_atrasado = case when pg.dias_atraso_al_pagar > 0
                          then greatest(veces_atrasado - 1, 0) else veces_atrasado end,
    updated_at = now()
  where id = pg.cliente_id;

  delete from caja where referencia_id = pg.id;
  delete from pagos where id = p_pago_id;
end; $$;
