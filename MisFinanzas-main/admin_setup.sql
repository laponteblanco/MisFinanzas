-- ############################################################################
-- MISFINANZAS PRO - SISTEMA DE ADMINISTRACIÓN Y LLAVES (PASO 1)
-- ############################################################################
-- Descripción: Infraestructura de Roles, Vouchers y Automatización Admin.
-- ############################################################################

-- 1. EXTENSIÓN DE PERFILES CON ROLES
-- ----------------------------------------------------------------------------
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user'));
    END IF;
END $$;

-- 2. TABLA DE LLAVES MAESTRAS (VOUCHERS)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.license_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_code TEXT UNIQUE NOT NULL, -- Formato MFP-XXXX-XXXX-XXXX
    plan_id UUID REFERENCES public.plans(id) NOT NULL,
    is_used BOOLEAN DEFAULT false,
    used_by UUID REFERENCES auth.users(id),
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS en llaves (Solo Admin puede leer todas, Usuario solo puede intentar redimir)
ALTER TABLE public.license_keys ENABLE ROW LEVEL SECURITY;

-- 3. MOTOR DE ACTIVACIÓN ATÓMICA
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.activate_license_key(p_key_code TEXT)
RETURNS JSONB AS $$
DECLARE
    v_key_id UUID;
    v_plan_id UUID;
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    -- 1. Validar llave
    SELECT id, plan_id INTO v_key_id, v_plan_id
    FROM public.license_keys
    WHERE key_code = p_key_code AND is_used = false
    LIMIT 1;

    IF v_key_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'La llave no es válida o ya ha sido utilizada.');
    END IF;

    -- 2. Transacción de activación
    -- Marcamos llave como usada
    UPDATE public.license_keys
    SET is_used = true, used_by = v_user_id, used_at = now()
    WHERE id = v_key_id;

    -- Actualizamos el plan del usuario (Proceso Pro)
    UPDATE public.profiles
    SET plan_id = v_plan_id,
        subscription_status = 'active',
        current_period_end = (now() + interval '1 year') -- Por defecto 1 año si es llave maestra, o ajustable
    WHERE id = v_user_id;

    RETURN jsonb_build_object('success', true, 'message', 'Licencia Pro activada exitosamente.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. TRIGGER DE AUTOPROMOCIÓN ADMISTRADOR
-- ----------------------------------------------------------------------------
-- Este trigger asegura que luisaponteblanco@gmail.com siempre sea admin
CREATE OR REPLACE FUNCTION public.handle_admin_promotion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.email = 'luisaponteblanco@gmail.com' THEN
        NEW.role := 'admin';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_admin_promotion ON public.profiles;
CREATE TRIGGER tr_admin_promotion
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_admin_promotion();

-- Forzar el rol de admin ahora mismo si ya existe
UPDATE public.profiles SET role = 'admin' WHERE email = 'luisaponteblanco@gmail.com';
UPDATE public.profiles SET role = 'user' WHERE email = 'luisapoteblanco@gmail.com'; -- Limpiar error anterior

-- 5. SEGURIDAD RLS (ADMIN ONLY)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can do everything in license_keys" ON public.license_keys;
CREATE POLICY "Admins can do everything in license_keys"
ON public.license_keys FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    )
);
