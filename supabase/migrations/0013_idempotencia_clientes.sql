-- Idempotencia para clientes: crearCliente se reintenta desde el outbox; sin un id de
-- operación único podía duplicar clientes. UNIQUE permite múltiples NULL (filas existentes).
alter table public.clientes add column if not exists client_op_id uuid;
alter table public.clientes add constraint clientes_client_op_id_key unique (client_op_id);
