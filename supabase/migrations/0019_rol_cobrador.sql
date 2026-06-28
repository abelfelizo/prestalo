-- Rol cobrador: un colaborador solo puede VER la cartera y REGISTRAR pagos.
-- No puede crear/editar/borrar clientes, préstamos, caja, garantías ni configuración.
-- (El dueño conserva control total.)

create or replace function public.ver_prestamo(pid uuid) returns boolean
 language sql stable security definer set search_path=public as $$
  select public.es_mi_prestamo(pid) or exists (
    select 1 from prestamos p join cartera_colaboradores cc on cc.cartera_id = p.cartera_id
    where p.id = pid and cc.user_id = auth.uid());
$$;
revoke execute on function public.ver_prestamo(uuid) from anon;

-- Los triggers de pago corren como SECURITY DEFINER: el cobrador inserta el pago y las
-- actualizaciones en cascada (préstamo, cliente, caja) no dependen de su rol.
alter function public.actualizar_tras_pago() security definer;
alter function public.actualizar_fecha_proximo_pago() security definer;
alter function public.registrar_cobro_caja() security definer;

drop policy if exists clientes_owner on public.clientes;
create policy clientes_select on public.clientes for select using (es_mi_cartera(cartera_id));
create policy clientes_ins on public.clientes for insert with check (soy_dueno_cartera(cartera_id));
create policy clientes_upd on public.clientes for update using (soy_dueno_cartera(cartera_id)) with check (soy_dueno_cartera(cartera_id));
create policy clientes_del on public.clientes for delete using (soy_dueno_cartera(cartera_id));

drop policy if exists prestamos_owner on public.prestamos;
create policy prestamos_select on public.prestamos for select using (es_mi_cartera(cartera_id));
create policy prestamos_ins on public.prestamos for insert with check (soy_dueno_cartera(cartera_id));
create policy prestamos_upd on public.prestamos for update using (soy_dueno_cartera(cartera_id)) with check (soy_dueno_cartera(cartera_id));
create policy prestamos_del on public.prestamos for delete using (soy_dueno_cartera(cartera_id));

drop policy if exists caja_owner on public.caja;
create policy caja_select on public.caja for select using (es_mi_cartera(cartera_id));
create policy caja_ins on public.caja for insert with check (soy_dueno_cartera(cartera_id));
create policy caja_upd on public.caja for update using (soy_dueno_cartera(cartera_id)) with check (soy_dueno_cartera(cartera_id));
create policy caja_del on public.caja for delete using (soy_dueno_cartera(cartera_id));

drop policy if exists config_owner on public.configuracion_cartera;
create policy config_select on public.configuracion_cartera for select using (es_mi_cartera(cartera_id));
create policy config_write on public.configuracion_cartera for all using (soy_dueno_cartera(cartera_id)) with check (soy_dueno_cartera(cartera_id));

drop policy if exists garantias_owner on public.garantias;
create policy garantias_select on public.garantias for select using (ver_prestamo(prestamo_id));
create policy garantias_write on public.garantias for all using (es_mi_prestamo(prestamo_id)) with check (es_mi_prestamo(prestamo_id));

drop policy if exists pagos_owner on public.pagos;
create policy pagos_select on public.pagos for select using (ver_prestamo(prestamo_id));
create policy pagos_ins on public.pagos for insert with check (ver_prestamo(prestamo_id));
create policy pagos_upd on public.pagos for update using (es_mi_prestamo(prestamo_id)) with check (es_mi_prestamo(prestamo_id));
create policy pagos_del on public.pagos for delete using (es_mi_prestamo(prestamo_id));
