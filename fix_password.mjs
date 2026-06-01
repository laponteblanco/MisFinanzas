import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Read .env.local
const envFile = readFileSync('.env.local', 'utf-8');
const env = {};
for (const line of envFile.split('\n')) {
    if (line.includes('=') && !line.startsWith('#')) {
        const [k, ...v] = line.split('=');
        env[k.trim()] = v.join('=').trim();
    }
}

const supabaseAdmin = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixPassword() {
    console.log("1. Buscando usuario luisaponteblanco@gmail.com ...");
    
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) {
        console.error("Error listando usuarios:", error);
        return;
    }

    const user = data.users.find(u => u.email === 'luisaponteblanco@gmail.com');
    if (!user) {
        console.log("❌ Usuario no encontrado. Creándolo...");
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: 'luisaponteblanco@gmail.com',
            password: 'MisFinanzas2026!',
            email_confirm: true
        });
        if (createError) {
            console.error("Error creando usuario:", createError);
        } else {
            console.log("✅ Usuario creado con contraseña MisFinanzas2026!");
            console.log("   ID:", newUser.user.id);
        }
        return;
    }

    console.log("✅ Usuario encontrado:");
    console.log("   ID:", user.id);
    console.log("   Email confirmado:", user.email_confirmed_at ? "Sí" : "NO");
    console.log("   Baneado:", user.banned_until ? user.banned_until : "No");
    console.log("   Último login:", user.last_sign_in_at || "Nunca");

    // Forzar contraseña y confirmar email
    console.log("\n2. Actualizando contraseña a 'luAponte15' y confirmando email...");
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        password: 'luAponte15',
        email_confirm: true,
        ban_duration: 'none'
    });

    if (updateError) {
        console.error("❌ Error actualizando:", updateError);
        return;
    }
    console.log("✅ Contraseña actualizada exitosamente");

    // Probar login con la nueva contraseña
    console.log("\n3. Probando login con las nuevas credenciales...");
    const anonClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
        email: 'luisaponteblanco@gmail.com',
        password: 'luAponte15'
    });

    if (signInError) {
        console.error("❌ Login falló:", signInError.message);
    } else {
        console.log("✅ Login exitoso!");
        console.log("   Session:", signInData.session ? "Creada" : "null");
    }
}

fixPassword();
