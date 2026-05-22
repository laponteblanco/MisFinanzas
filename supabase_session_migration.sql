-- ============================================================
-- MIGRACIÓN: Tabla user_sessions para control de sesión única
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Crear la tabla user_sessions
CREATE TABLE IF NOT EXISTS public.user_sessions (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    session_token UUID NOT NULL DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Habilitar RLS (Row Level Security)
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- 3. Política: El usuario solo puede leer su propia sesión
CREATE POLICY "Users can read own session"
    ON public.user_sessions
    FOR SELECT
    USING (auth.uid() = user_id);

-- 4. Política: El usuario puede insertar su propia sesión
CREATE POLICY "Users can insert own session"
    ON public.user_sessions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 5. Política: El usuario puede actualizar su propia sesión
CREATE POLICY "Users can update own session"
    ON public.user_sessions
    FOR UPDATE
    USING (auth.uid() = user_id);

-- 6. Habilitar Realtime para la tabla (notificaciones en tiempo real)
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_sessions;

-- ============================================================
-- VERIFICACIÓN: Ejecutar después de la migración
-- ============================================================
-- SELECT * FROM public.user_sessions;
