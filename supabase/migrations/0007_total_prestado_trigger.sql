-- Mantener clientes.total_prestado al día: se incrementa con el capital
-- desembolsado al crear cada préstamo (antes nunca se actualizaba => quedaba en 0).
CREATE OR REPLACE FUNCTION public.actualizar_total_prestado()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE clientes SET
    total_prestado = total_prestado + NEW.monto_capital,
    updated_at = NOW()
  WHERE id = NEW.cliente_id;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trigger_actualizar_total_prestado ON public.prestamos;
CREATE TRIGGER trigger_actualizar_total_prestado
  AFTER INSERT ON public.prestamos
  FOR EACH ROW EXECUTE FUNCTION actualizar_total_prestado();

-- Backfill: recalcular total_prestado para clientes existentes a partir de
-- sus préstamos vigentes (no eliminados).
UPDATE clientes c SET total_prestado = COALESCE(sub.suma, 0)
FROM (
  SELECT cliente_id, SUM(monto_capital) AS suma
  FROM prestamos
  WHERE deleted_at IS NULL
  GROUP BY cliente_id
) sub
WHERE c.id = sub.cliente_id;
