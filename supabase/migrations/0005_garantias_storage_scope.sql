-- Restringe las fotos de garantías (cédulas/tarjetas) al dueño/colaborador del préstamo.
-- Antes: cualquier usuario autenticado podía leer/borrar fotos de cualquier prestamista.
-- Ahora: las fotos viven en "<prestamo_id>/<archivo>" y el acceso se valida con es_mi_prestamo.
drop policy if exists garantias_lectura_autenticada on storage.objects;
drop policy if exists garantias_borrado_autenticado on storage.objects;
drop policy if exists garantias_subida_autenticada on storage.objects;

create policy garantias_lectura_propia on storage.objects
  for select to authenticated
  using (bucket_id = 'garantias' and public.es_mi_prestamo(((storage.foldername(name))[1])::uuid));

create policy garantias_borrado_propio on storage.objects
  for delete to authenticated
  using (bucket_id = 'garantias' and public.es_mi_prestamo(((storage.foldername(name))[1])::uuid));

create policy garantias_subida_propia on storage.objects
  for insert to authenticated
  with check (bucket_id = 'garantias' and public.es_mi_prestamo(((storage.foldername(name))[1])::uuid));
