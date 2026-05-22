-- ############################################################################
-- MISFINANZAS PRO - ARQUITECTURA DE MONETIZACIÓN (PASO 1)
-- ############################################################################
-- Descripción: Reingeniería de planes, suscripciones y control de acceso.
-- ############################################################################

-- 1. REESTRUCTURACIÓN DE LA TABLA PLANS
-- ----------------------------------------------------------------------------
-- Aseguramos que la columna name sea única para que ON CONFLICT funcione
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plans_name_key') THEN
        ALTER TABLE public.plans ADD CONSTRAINT plans_name_key UNIQUE (name);
    END IF;
END $$;

ALTER TABLE public.plans 
ADD COLUMN IF NOT EXISTS billing_cycle TEXT CHECK (billing_cycle IN ('trial', 'monthly', 'semiannual', 'annual')),
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT UNIQUE;

-- 2. INSERCIÓN DE PLANES SEMILLA (Idempotente)
-- ----------------------------------------------------------------------------
INSERT INTO public.plans (name, billing_cycle, stripe_price_id, features)
VALUES 
    ('Prueba 15 Días', 'trial', NULL, '{"full_access": true, "ai_insights": true, "export": true}'),
    ('Pro Mensual', 'monthly', 'price_monthly_placeholder', '{"full_access": true, "ai_insights": true, "export": true}'),
    ('Pro Semestral', 'semiannual', 'price_semiannual_placeholder', '{"full_access": true, "ai_insights": true, "export": true}'),
    ('Pro Anual', 'annual', 'price_annual_placeholder', '{"full_access": true, "ai_insights": true, "export": true}')
ON CONFLICT (name) DO UPDATE 
SET billing_cycle = EXCLUDED.billing_cycle, features = EXCLUDED.features;

-- 3. ACTUALIZACIÓN DE LA TABLA PROFILES
-- ----------------------------------------------------------------------------
-- subscription_status: trialing, active, past_due, canceled
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trialing' CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled')),
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE;

-- Asegurar que trial_end_at sea correcto y persistente
COMMENT ON COLUMN public.profiles.trial_end_at IS 'Fecha fin del periodo de prueba gratuita';

-- 4. TRIGGER DE AUTO-REGISTRO (15 DÍAS TRIAL)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER AS $$
DECLARE
    trial_plan_id UUID;
    user_name TEXT;
BEGIN
    -- 1. Obtener ID del Plan Trial
    SELECT id INTO trial_plan_id FROM public.plans WHERE billing_cycle = 'trial' LIMIT 1;

    -- 2. Sanitizar nombre
    user_name := INITCAP(COALESCE(
        NEW.raw_user_meta_data->>'display_name', 
        split_part(NEW.email, '@', 1)
    ));

    -- 3. Insertar Perfil con 15 Días de Trial Automático
    INSERT INTO public.profiles (
        id, 
        email, 
        display_name, 
        plan_id, 
        subscription_status, 
        trial_end_at
    )
    VALUES (
        NEW.id, 
        NEW.email, 
        user_name, 
        trial_plan_id, 
        'trialing', 
        now() + interval '15 days'
    )
    ON CONFLICT (id) DO UPDATE 
    SET trial_end_at = EXCLUDED.trial_end_at,
        subscription_status = 'trialing',
        plan_id = EXCLUDED.plan_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-vincular el trigger de Auth al nuevo motor de suscripción
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();

-- 5. VISTA DE ESTADO DE LICENCIA (EL MOTOR DEL PAYWALL)
-- ----------------------------------------------------------------------------
-- IMPORTANTE: Eliminamos la vista anterior para evitar errores de cambio de nombres de columnas
DROP VIEW IF EXISTS public.user_license_status CASCADE;

CREATE OR REPLACE VIEW public.user_license_status AS
SELECT 
    p.id as user_id,
    p.display_name,
    pl.name as plan_name,
    pl.billing_cycle,
    p.subscription_status,
    p.trial_end_at,
    p.current_period_end,
    --has_active_access: Verdadero si está pagando o tiene trial vigente
    (
        p.subscription_status = 'active' OR 
        (p.subscription_status = 'trialing' AND p.trial_end_at > now())
    ) as has_active_access,
    -- days_left: Días restantes de trial (0 si expiró)
    GREATEST(0, EXTRACT(DAY FROM p.trial_end_at - now()))::INTEGER as trial_days_left
FROM public.profiles p
JOIN public.plans pl ON p.plan_id = pl.id;

-- Permisos para la vista
GRANT SELECT ON public.user_license_status TO authenticated;
