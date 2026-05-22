-- ============================================================
-- MIGRACIÓN: Control de Onboarding (Tour Completado)
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Agregar columna tour_completed a la tabla de perfiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tour_completed BOOLEAN DEFAULT false;

-- 2. Asegurar que los perfiles existentes tengan el valor por defecto
UPDATE public.profiles SET tour_completed = false WHERE tour_completed IS NULL;

-- 3. (Opcional) Si quieres resetear el tour para todos los usuarios:
-- UPDATE public.profiles SET tour_completed = false;
