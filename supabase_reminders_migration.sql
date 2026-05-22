-- ============================================================
-- MIGRACIÓN: Módulo de Recordatorios de Pago
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Crear tabla de recordatorios
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    amount NUMERIC(15,2) DEFAULT 0,
    due_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_recurring BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Habilitar RLS
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Seguridad (RLS)
CREATE POLICY "Users can view their own reminders" 
ON public.reminders FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reminders" 
ON public.reminders FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders" 
ON public.reminders FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders" 
ON public.reminders FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Trigger para updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_reminders_updated_at
    BEFORE UPDATE ON public.reminders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
