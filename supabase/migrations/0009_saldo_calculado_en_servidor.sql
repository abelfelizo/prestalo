-- El saldo del préstamo se calcula EN EL SERVIDOR desde el saldo actual de la BD,
-- no se confía en saldo_despues enviado por el cliente (evita pisar el saldo real
-- con datos en caché desactualizados / pagos offline / dos dispositivos).
create or replace function public.actualizar_tras_pago()
 returns trigger
 language plpgsql
 set search_path to 'public'
as $function$
begin
  update prestamos set
    saldo_pendiente = greatest(saldo_pendiente - least(new.monto_capital + new.monto_interes, saldo_pendiente), 0),
    fecha_ultimo_pago = new.fecha_pago,
    dias_en_mora = 0,
    total_intereses_generados = total_intereses_generados + new.monto_interes,
    total_mora_generada = total_mora_generada + new.monto_mora,
    cuotas_pagadas = case
      when new.tipo_pago = 'cuota_completa' then cuotas_pagadas + 1
      else cuotas_pagadas end,
    estado = case
      when (saldo_pendiente - least(new.monto_capital + new.monto_interes, saldo_pendiente)) <= 0 then 'cerrado'
      else 'activo' end,
    updated_at = now()
  where id = new.prestamo_id;

  update clientes set
    total_pagado = total_pagado + new.monto_total,
    score = case
      when new.dias_atraso_al_pagar = 0   then least(score + 2, 100)
      when new.dias_atraso_al_pagar <= 5  then greatest(score - 5, 0)
      when new.dias_atraso_al_pagar <= 15 then greatest(score - 15, 0)
      else greatest(score - 25, 0) end,
    veces_atrasado = case
      when new.dias_atraso_al_pagar > 0 then veces_atrasado + 1
      else veces_atrasado end,
    updated_at = now()
  where id = new.cliente_id;

  return new;
end;
$function$;
