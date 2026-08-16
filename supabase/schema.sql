-- ============================================================
-- Saldo Transporte — Schema de Base de Datos PostgreSQL + RLS
-- Copia y ejecuta este script completo en el SQL Editor de tu panel de Supabase

-- IMPORTANTE: todas las tablas, funciones y triggers usan el prefijo
-- "transporte_" porque este proyecto comparte la base de datos con
-- Migrante$ (prefijo "migrante_") -- evita choques de nombres.

-- Este script es 100% seguro de volver a ejecutar las veces que sea
-- necesario (usa IF NOT EXISTS / DROP ... IF EXISTS antes de cada
-- POLICY/TRIGGER para que nunca truene por "ya existe").
--
-- Nota: este archivo ya fue ejecutado en el proyecto de Supabase.
-- Se conserva aquí solo como referencia versionada del schema base.
-- Los cambios adicionales viven en supabase/migrations/.
-- ============================================================

-- 0. EXTENSIONES (no-op si ya existe por el otro proyecto)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. FUNCIÓN COMPARTIDA DE updated_at (con nombre propio, sin depender de migrante_)
CREATE OR REPLACE FUNCTION transporte_update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. TABLA: transporte_config (Configuración y saldo actual por usuario)
CREATE TABLE IF NOT EXISTS public.transporte_config (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  costo_viaje  NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (costo_viaje >= 0),
  saldo_actual NUMERIC(10, 2) NOT NULL DEFAULT 0,
  moneda       TEXT NOT NULL DEFAULT 'MXN',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.transporte_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Los usuarios administran su propia configuración" ON public.transporte_config;
CREATE POLICY "Los usuarios administran su propia configuración"
ON public.transporte_config FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_transporte_config_updated_at ON public.transporte_config;
CREATE TRIGGER update_transporte_config_updated_at
BEFORE UPDATE ON public.transporte_config
FOR EACH ROW
EXECUTE PROCEDURE transporte_update_updated_at_column();

-- 3. TABLA: transporte_horarios (Frecuencia/horarios de uso programado)
CREATE TABLE IF NOT EXISTS public.transporte_horarios (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hora         TIME NOT NULL,
  dias_semana  SMALLINT[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}', -- 0=domingo ... 6=sábado
  activo       BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transporte_horarios_user_id ON public.transporte_horarios(user_id);

ALTER TABLE public.transporte_horarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Los usuarios administran sus horarios" ON public.transporte_horarios;
CREATE POLICY "Los usuarios administran sus horarios"
ON public.transporte_horarios FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. TABLA: transporte_movimientos (Historial: recargas, descuentos, ajustes)
CREATE TABLE IF NOT EXISTS public.transporte_movimientos (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo        TEXT NOT NULL CHECK (tipo IN ('recarga', 'viaje_automatico', 'viaje_manual', 'ajuste')),
  monto       NUMERIC(10, 2) NOT NULL, -- positivo = aumenta saldo, negativo = lo disminuye
  descripcion TEXT,
  fecha       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transporte_movimientos_user_id ON public.transporte_movimientos(user_id);
CREATE INDEX IF NOT EXISTS idx_transporte_movimientos_fecha ON public.transporte_movimientos(fecha DESC);

ALTER TABLE public.transporte_movimientos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Los usuarios administran sus movimientos" ON public.transporte_movimientos;
CREATE POLICY "Los usuarios administran sus movimientos"
ON public.transporte_movimientos FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
