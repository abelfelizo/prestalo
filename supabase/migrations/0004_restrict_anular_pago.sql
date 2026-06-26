-- anular_pago muta datos: solo usuarios autenticados (RLS interna valida propiedad).
revoke execute on function public.anular_pago(uuid) from public, anon;
grant execute on function public.anular_pago(uuid) to authenticated;
