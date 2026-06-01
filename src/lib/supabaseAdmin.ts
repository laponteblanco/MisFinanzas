import { createClient } from '@supabase/supabase-js';

/**
 * Cliente de Supabase con Service Role (Solo Servidor)
 * ¡PRECAUCIÓN! Este cliente elude todas las políticas de RLS.
 * ÚSALO SOLO en Server Actions o Route Handlers. No exponer al cliente.
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
