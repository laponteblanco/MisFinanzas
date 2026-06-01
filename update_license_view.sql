-- ############################################################################
-- MISFINANZAS PRO - ROBUST LICENSE VIEW MIGRATION
-- ############################################################################
-- Descripción: Re-configuración de la vista user_license_status para utilizar
--              un LEFT JOIN y otorgar acceso ilimitado e ininterrumpido
--              a los usuarios con rol 'admin'.
-- ############################################################################

-- 1. ELIMINAR LA VISTA ANTERIOR
DROP VIEW IF EXISTS public.user_license_status CASCADE;

-- 2. CREAR LA NUEVA VISTA ROBUSTA
CREATE OR REPLACE VIEW public.user_license_status AS
SELECT 
    p.id as user_id,
    p.display_name,
    COALESCE(pl.name, 'Gratis') as plan_name,
    COALESCE(pl.billing_cycle, 'monthly') as billing_cycle,
    COALESCE(p.subscription_status, 'active') as subscription_status,
    p.trial_end_at,
    p.current_period_end,
    -- has_active_access: Verdadero si es admin, está pagando, o tiene trial vigente
    (
        p.role = 'admin' OR
        p.subscription_status = 'active' OR 
        (p.subscription_status = 'trialing' AND (p.trial_end_at IS NULL OR p.trial_end_at > now()))
    ) as has_active_access,
    -- trial_days_left: Días restantes de trial (0 si expiró, no aplica o es admin)
    CASE 
        WHEN p.role = 'admin' THEN 365 -- Un valor seguro por defecto para admins
        WHEN p.trial_end_at IS NULL THEN 0
        ELSE GREATEST(0, EXTRACT(DAY FROM p.trial_end_at - now()))::INTEGER
    END as trial_days_left
FROM public.profiles p
LEFT JOIN public.plans pl ON p.plan_id = pl.id;

-- 3. GARANTIZAR PERMISOS A LA VISTA
GRANT SELECT ON public.user_license_status TO authenticated;
GRANT SELECT ON public.user_license_status TO anon;
GRANT SELECT ON public.user_license_status TO service_role;

-- ############################################################################
-- ✅ Instrucciones para ejecutar:
-- Copia este bloque de código completo, ve a tu panel de Supabase:
-- Supabase Dashboard -> SQL Editor -> New Query -> Pega el código -> Haz clic en "Run".
-- ############################################################################
