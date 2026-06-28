-- clientes.total_prestado solo subía al crear el préstamo; nunca bajaba al cancelarlo/borrarlo.
-- Al hacer soft-delete (deleted_at), descontar el capital del total prestado del cliente.
create or replace function public.ajustar_total_prestado_al_borrar()
returns trigger language plpgsql set search_path to 'public' as $$
begin
  if old.deleted_at is null and new.deleted_at is not null then
    update clientes set total_prestado = greatest(total_prestado - new.monto_capital, 0),
                        updated_at = now()
    where id = new.cliente_id;
  end if;
  return new;
end; $$;

drop trigger if exists trg_ajustar_total_prestado_al_borrar on public.prestamos;
create trigger trg_ajustar_total_prestado_al_borrar
  after update on public.prestamos
  for each row execute function ajustar_total_prestado_al_borrar();
