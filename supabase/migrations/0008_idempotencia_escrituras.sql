-- Idempotencia: cada operación de escritura lleva un id de cliente único.
-- Reintentos (red caída tras escribir) NO duplican pagos/préstamos/caja.
alter table public.pagos     add column if not exists client_op_id uuid;
alter table public.prestamos add column if not exists client_op_id uuid;
alter table public.caja      add column if not exists client_op_id uuid;

-- UNIQUE estándar permite múltiples NULL (filas existentes / ediciones manuales)
-- pero impide insertar dos veces el mismo client_op_id.
alter table public.pagos     add constraint pagos_client_op_id_key     unique (client_op_id);
alter table public.prestamos add constraint prestamos_client_op_id_key unique (client_op_id);
alter table public.caja      add constraint caja_client_op_id_key      unique (client_op_id);
