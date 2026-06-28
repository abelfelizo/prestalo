-- Proceso de herencia: convertir el interruptor pasivo en avisos automáticos.
--  - Salvaguarda al dueño cuando faltan pocos días para que se abra el acceso ("¿sigues ahí?").
--  - Marca el momento en que el acceso del heredero queda disponible (acceso_disponible_desde).
-- NO toca libro_* ni turno_*.

alter table public.herederos add column if not exists acceso_disponible_desde timestamptz;

create or replace function public.procesar_herederos()
returns void language plpgsql security definer set search_path to 'public' as $$
declare
  r record;
  v_dias int;
begin
  for r in
    select h.id, h.prestamista_id, h.nombre, h.dias_inactividad,
           (current_date - (p.updated_at)::date) as dias_inactivo,
           h.acceso_disponible_desde
    from herederos h
    join prestamistas p on p.id = h.prestamista_id
  loop
    v_dias := r.dias_inactivo;

    -- Salvaguarda al dueño: faltan <= 3 días para que el heredero pueda acceder.
    if v_dias >= r.dias_inactividad - 3 and v_dias < r.dias_inactividad then
      insert into alertas (prestamista_id, tipo, titulo, mensaje, fecha_alerta, leida)
      values (r.prestamista_id, 'heredero', 'Tu cuenta está inactiva',
        'Tu cuenta lleva ' || v_dias || ' días inactiva. En ' || (r.dias_inactividad - v_dias) ||
        ' día(s) tu heredero podrá acceder. Abre la app para reiniciar el contador.',
        current_date, false);
    end if;

    -- Acceso disponible: registrar una sola vez y avisar al dueño.
    if v_dias >= r.dias_inactividad and r.acceso_disponible_desde is null then
      update herederos set acceso_disponible_desde = now() where id = r.id;
      insert into alertas (prestamista_id, tipo, titulo, mensaje, fecha_alerta, leida)
      values (r.prestamista_id, 'heredero', 'Acceso de heredero habilitado',
        'El acceso de tu heredero ' || r.nombre || ' quedó disponible por inactividad.',
        current_date, false);
    end if;
  end loop;
end; $$;

revoke execute on function public.procesar_herederos() from anon, authenticated;

-- Programar a diario (pg_cron ya está habilitado en el proyecto). El dueño aplica esta migración.
-- cron.schedule actualiza el job si ya existe con ese nombre.
select cron.schedule('procesar_herederos_diario', '0 12 * * *', $$select public.procesar_herederos();$$);

-- NOTA (limitación documentada): el heredero no es usuario de la app, así que no tenemos un
-- canal directo para notificarle al activarse el acceso. Queda `acceso_disponible_desde` como
-- base; si en el futuro el heredero registra su propio dispositivo, se le podrá notificar.
