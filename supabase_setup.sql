-- ############################################################################
-- MISFINANZAS PRO - SAAS FOUNDATION SETUP (PRODUCTION READY)
-- ############################################################################
-- Descripción: Configuración de identidad, multi-tenencia y monetización.
-- Autor: Senior Database Engineer (SaaS Architecture)
-- Orden de Ejecución: 
-- 1. Tablas Base -> 2. Datos Semilla -> 3. Funciones -> 4. Triggers -> 5. RLS
-- ############################################################################

-- 1. TABLAS BASE
-- ----------------------------------------------------------------------------

-- Catálogo de Planes (Monetización)
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    price_id TEXT, -- ID Externo (Stripe)
    features JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Workspaces (Preparación para B2B / Cuentas Empresariales)
CREATE TABLE IF NOT EXISTS public.workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Perfiles de Usuario (Extensión de auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    plan_id UUID REFERENCES public.plans(id),
    workspace_id UUID REFERENCES public.workspaces(id), -- Relación Pro ready
    onboarding_completed BOOLEAN DEFAULT false,
    trial_end_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'), 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 2. DATOS SEMILLA (PLANS)
-- ----------------------------------------------------------------------------
-- IMPORTANTE: Definir el plan inicial antes de activar los triggers de usuario
INSERT INTO public.plans (name, features)
VALUES ('Gratis', '{"max_categories": 10, "export_pdf": false, "ai_insights": false}')
ON CONFLICT (name) DO NOTHING;

-- 3. FUNCIONES DE UTILIDAD
-- ----------------------------------------------------------------------------

-- Función universal para actualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función robusta para creación de perfil (Signup Trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_plan_id UUID;
    user_name TEXT;
BEGIN
    -- 1. Obtener el ID del plan inicial ("Gratis") de forma dinámica
    SELECT id INTO default_plan_id FROM public.plans WHERE name = 'Gratis' LIMIT 1;

    -- 2. Sanitizar el nombre desde metadata o email (Formato Humano)
    user_name := INITCAP(COALESCE(
        NEW.raw_user_meta_data->>'display_name', 
        split_part(NEW.email, '@', 1)
    ));

    -- 3. Inserción con manejo de errores (Resiliencia SaaS)
    BEGIN
        INSERT INTO public.profiles (id, email, display_name, plan_id)
        VALUES (NEW.id, NEW.email, user_name, default_plan_id);
    EXCEPTION WHEN OTHERS THEN
        -- Registrar error en logs de PostgreSQL pero permitir que auth.users complete el registro
        RAISE WARNING 'Error creando perfil para usuario %: %', NEW.id, SQLERRM;
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. TRIGGERS
-- ----------------------------------------------------------------------------

-- Trigger para updated_at en Profiles
DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger para updated_at en Plans
DROP TRIGGER IF EXISTS tr_plans_updated_at ON public.plans;
CREATE TRIGGER tr_plans_updated_at
    BEFORE UPDATE ON public.plans
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
-- Trigger para updated_at en Workspaces
DROP TRIGGER IF EXISTS tr_workspaces_updated_at ON public.workspaces;
CREATE TRIGGER tr_workspaces_updated_at
    BEFORE UPDATE ON public.workspaces
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Trigger de Registro (Auth Event)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Índices para Escalabilidad
CREATE INDEX IF NOT EXISTS idx_profiles_plan_id ON public.profiles(plan_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_lookup ON public.profiles(id, plan_id);

-- 5. SEGURIDAD (RLS)
-- ----------------------------------------------------------------------------

-- Habilitar Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Políticas de Profiles (Aislamiento Total + Soft Delete)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id 
    AND (plan_id IS NOT DISTINCT FROM (SELECT plan_id FROM public.profiles WHERE id = auth.uid()))
);

DROP POLICY IF EXISTS "Users cannot insert profiles manually" ON public.profiles;
CREATE POLICY "Users cannot insert profiles manually"
ON public.profiles FOR INSERT
WITH CHECK (false);

DROP POLICY IF EXISTS "Prevent physical delete" ON public.profiles;
CREATE POLICY "Prevent physical delete"
ON public.profiles FOR DELETE
USING (false);

-- Políticas de Plans (Lectura pública para suscripción)
DROP POLICY IF EXISTS "Public plans are viewable by everyone" ON public.plans;
CREATE POLICY "Public plans are viewable by everyone"
ON public.plans FOR SELECT
USING (is_active = true);

-- 6. SEGURIDAD WORKSPACES (SAAS B2B)
-- ----------------------------------------------------------------------------
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their workspace" ON public.workspaces;
CREATE POLICY "Users can view their workspace"
ON public.workspaces FOR SELECT
USING (
    id IN (
        SELECT workspace_id 
        FROM public.profiles 
        WHERE id = auth.uid()
    )
);

DROP POLICY IF EXISTS "No direct workspace insert" ON public.workspaces;
CREATE POLICY "No direct workspace insert"
ON public.workspaces FOR INSERT
WITH CHECK (false);
-- 7. TABLAS DE NEGOCIO (CORE FINANCIERO)
-- ----------------------------------------------------------------------------

-- Categorías (Globales y Personalizadas)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NULL, -- NULL para categorías globales
    name TEXT NOT NULL,
    emoji TEXT DEFAULT '💰',
    budget DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, name)
);

-- Transacciones (Movimientos de Dinero)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    category TEXT,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    description TEXT,
    responsibles JSONB DEFAULT '[]'::jsonb,
    is_recurring BOOLEAN DEFAULT false,
    recurring_group_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- AI Insights (Guía de Acción Inteligente)
CREATE TABLE IF NOT EXISTS public.ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    type TEXT CHECK (type IN ('warning', 'improvement', 'recommendation')) NOT NULL,
    impact DECIMAL(12,2) DEFAULT 0,
    action TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. DATOS SEMILLA (CATEGORIES)
-- ----------------------------------------------------------------------------
INSERT INTO public.categories (name, emoji)
VALUES 
    ('Alimentación', '🍔'),
    ('Vivienda', '🏠'),
    ('Transporte', '🚗'),
    ('Salud', '🏥'),
    ('Entretenimiento', '🎬'),
    ('Ingresos', '💰'),
    ('Otros', '📦')
ON CONFLICT (user_id, name) DO NOTHING;

-- 9. TRIGGERS DE NEGOCIO
-- ----------------------------------------------------------------------------
CREATE TRIGGER tr_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER tr_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 10. SEGURIDAD DE NEGOCIO (RLS)
-- ----------------------------------------------------------------------------

-- RLS Categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public categories are viewable by everyone"
    ON public.categories FOR SELECT USING (user_id IS NULL);
CREATE POLICY "Users can manage their own categories"
    ON public.categories FOR ALL USING (auth.uid() = user_id);

-- RLS Transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their transactions"
    ON public.transactions FOR ALL USING (auth.uid() = user_id AND deleted_at IS NULL);

-- RLS AI Insights
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their insights"
    ON public.ai_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System can manage insights"
    ON public.ai_insights FOR ALL USING (auth.uid() = user_id); -- For client-side simulation or server logic
