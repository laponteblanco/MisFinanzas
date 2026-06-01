import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Cliente de Supabase con Service Role (Solo Servidor)
 * ¡PRECAUCIÓN! Este cliente elude todas las políticas de RLS.
 * ÚSALO SOLO en Server Actions o Route Handlers. No exponer al cliente.
 */
export const supabaseAdmin = (url && key)
  ? createClient(url, key)
  : null;

