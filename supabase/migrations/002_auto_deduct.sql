-- ============================================================
-- Saldo Transporte — Migración 002: saldo automático + descuento
-- programado por horario.
--
-- Ejecuta este script en el SQL Editor de Supabase DESPUÉS de
-- supabase/schema.sql (que ya corriste). Es aditivo e idempotente:
-- se puede volver a correr las veces que sea necesario.
-- ============================================================

-- 1. Relaciona cada descuento automático con el horario que lo generó,
--    para poder saber si un horario ya se aplicó hoy (evita duplicados).
ALTER TABLE public.transporte_movimientos
  ADD COLUMN IF NOT EXISTS horario_id UUID REFERENCES public.transporte_horarios(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transporte_movimientos_horario_id
  ON public.transporte_movimientos(horario_id);

-- 2. Mantiene transporte_config.saldo_actual sincronizado automáticamente
--    con la suma de transporte_movimientos.monto, sin que la app tenga
--    que actualizar dos tablas a la vez.
CREATE OR REPLACE FUNCTION transporte_aplicar_movimiento()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.transporte_config
    SET saldo_actual = saldo_actual + NEW.monto
    WHERE user_id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.transporte_config
    SET saldo_actual = saldo_actual - OLD.monto + NEW.monto
    WHERE user_id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.transporte_config
    SET saldo_actual = saldo_actual - OLD.monto
    WHERE user_id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_transporte_movimientos_saldo ON public.transporte_movimientos;
CREATE TRIGGER trg_transporte_movimientos_saldo
AFTER INSERT OR UPDATE OR DELETE ON public.transporte_movimientos
FOR EACH ROW
EXECUTE FUNCTION transporte_aplicar_movimiento();

-- 3. Procesa los descuentos automáticos vencidos: por cada horario
--    activo cuya hora ya pasó hoy (en la zona horaria indicada) y que
--    todavía no tenga un movimiento 'viaje_automatico' registrado para
--    hoy, inserta el descuento correspondiente. Es SECURITY DEFINER
--    porque necesita leer/escribir movimientos de todos los usuarios
--    (RLS normalmente solo deja ver los propios) y es segura de exponer
--    porque es idempotente y no filtra datos entre usuarios.
--
--    Ajusta 'America/Mexico_City' si tus usuarios están en otra zona
--    horaria.
CREATE OR REPLACE FUNCTION transporte_procesar_descuentos()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  zona CONSTANT TEXT := 'America/Mexico_City';
  hoy DATE := (NOW() AT TIME ZONE zona)::date;
  ahora TIME := (NOW() AT TIME ZONE zona)::time;
  dow SMALLINT := EXTRACT(DOW FROM (NOW() AT TIME ZONE zona))::smallint;
BEGIN
  FOR r IN
    SELECT h.id AS horario_id, h.user_id, c.costo_viaje
    FROM public.transporte_horarios h
    JOIN public.transporte_config c ON c.user_id = h.user_id
    WHERE h.activo = true
      AND dow = ANY(h.dias_semana)
      AND h.hora <= ahora
      AND c.costo_viaje > 0
      AND NOT EXISTS (
        SELECT 1 FROM public.transporte_movimientos m
        WHERE m.horario_id = h.id
          AND m.tipo = 'viaje_automatico'
          AND (m.fecha AT TIME ZONE zona)::date = hoy
      )
  LOOP
    INSERT INTO public.transporte_movimientos (user_id, tipo, monto, descripcion, horario_id)
    VALUES (
      r.user_id,
      'viaje_automatico',
      -r.costo_viaje,
      'Descuento automático programado',
      r.horario_id
    );
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION transporte_procesar_descuentos() TO authenticated;

-- 4. OPCIONAL pero recomendado: programa el procesamiento cada 15
--    minutos con pg_cron, para que el descuento ocurra puntual aunque
--    nadie tenga la app abierta. Sin esto, el descuento se aplica de
--    todas formas la próxima vez que un usuario abra el dashboard
--    (la app llama a transporte_procesar_descuentos() al cargar).
--
--    Pasos:
--    1. Dashboard de Supabase -> Database -> Extensions -> habilita "pg_cron".
--    2. Ejecuta UNA VEZ:
--
--    SELECT cron.schedule(
--      'transporte-procesar-descuentos',
--      '*/15 * * * *',
--      $$SELECT public.transporte_procesar_descuentos();$$
--    );
--
--    Para quitar el job más adelante:
--    SELECT cron.unschedule('transporte-procesar-descuentos');
