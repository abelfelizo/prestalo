-- Kuotas — soft-delete en caja y garantias (borrado lógico, recuperable)
-- Aditivo y seguro: columnas nullable, no rompe datos existentes.
ALTER TABLE public.caja ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.garantias ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
CREATE INDEX IF NOT EXISTS idx_caja_cartera_activos ON public.caja (cartera_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_garantias_prestamo_activos ON public.garantias (prestamo_id) WHERE deleted_at IS NULL;
