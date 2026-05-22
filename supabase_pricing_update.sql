-- ============================================================
-- MIGRACIÓN: Actualización de Precios a COP (Pesos Colombianos)
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Asegurarse de que los planes existan con los IDs correctos y actualizar valores
-- Nota: Asumimos que los IDs coinciden con 'price_monthly', 'price_semiannual' y 'price_annual'
-- tal como se usan en el componente PricingGlass.

-- Actualizar Plan Mensual
UPDATE public.plans 
SET 
    name = 'Pro Mensual',
    price = 8000,
    currency = 'COP',
    updated_at = now()
WHERE id = 'price_monthly' OR billing_cycle = 'monthly';

-- Actualizar Plan Semestral
UPDATE public.plans 
SET 
    name = 'Pro Semestral',
    price = 36000,
    currency = 'COP',
    updated_at = now()
WHERE id = 'price_semiannual' OR billing_cycle = 'semiannual';

-- Actualizar Plan Anual
UPDATE public.plans 
SET 
    name = 'Pro Anual',
    price = 60000,
    currency = 'COP',
    updated_at = now()
WHERE id = 'price_annual' OR billing_cycle = 'annual';

-- 2. Verificar los cambios
-- SELECT id, name, price, currency, billing_cycle FROM public.plans;
