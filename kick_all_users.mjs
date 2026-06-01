import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envFile = readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envFile.split('\n')) {
    if (line.includes('=') && !line.startsWith('#')) {
        const [k, ...v] = line.split('=');
        env[k.trim()] = v.join('=').trim().replace(/^"|"$/g, '');
    }
}

const supabaseAdmin = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
);

async function kickAllUsers() {
    console.log("Cerrando sesión de todos los usuarios (invalidando active_session_id)...");
    
    // Al setear active_session_id a NULL, o a un UUID nuevo, el Session Guard en el frontend
    // detectará que el token local no coincide con el de la base de datos y forzará el cierre de sesión.
    const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({ active_session_id: null })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Dummy condition to update all rows
        
    if (error) {
        console.error("Error al cerrar sesiones:", error);
    } else {
        console.log("¡Sesiones cerradas con éxito! Todos los usuarios activos serán expulsados al Login.");
    }
}

kickAllUsers();
