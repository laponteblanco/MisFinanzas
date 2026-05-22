import { createBrowserClient } from '@supabase/auth-helpers-nextjs'

/**
 * Cliente de Supabase (Nivel Industrial)
 * Configurado para el navegador (Client Components)
 * Sincronización automática de sesión vía cookies
 */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)