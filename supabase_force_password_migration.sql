-- ==============================================================================
-- MIGRACIÓN: Cambio de Contraseña Obligatorio
-- ==============================================================================
-- Descripción: Añade una bandera a los perfiles para forzar el cambio de 
-- contraseña en el próximo inicio de sesión.
-- ==============================================================================

-- 1. Añadir la columna a la tabla profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT false;

-- 2. Activar la bandera para TODOS los usuarios actuales
-- Esto forzará que todos los usuarios que ya existían antes de esta 
-- actualización tengan que cambiar su contraseña.
UPDATE public.profiles 
SET force_password_change = true 
WHERE force_password_change IS false OR force_password_change IS NULL;
