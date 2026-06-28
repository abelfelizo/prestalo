-- Un refinanciamiento (prestamo_padre_id no nulo) NO es una salida real de efectivo:
-- el saldo viejo rueda al préstamo nuevo. Antes se registraba un desembolso en caja por
-- cada refinanciamiento, subvaluando el balance. Ahora solo se registra para préstamos nuevos.
create or replace function public.registrar_desembolso_caja()
returns trigger language plpgsql set search_path to 'public' as $$
begin
  if new.prestamo_padre_id is null then
    insert into caja (cartera_id, tipo, categoria, monto, descripcion, referencia_id, fecha)
    values (new.cartera_id, 'salida', 'desembolso', new.monto_capital,
      'Prestamo a ' || (select nombre from clientes where id = new.cliente_id),
      new.id, new.fecha_inicio);
  end if;
  return new;
end; $$;
