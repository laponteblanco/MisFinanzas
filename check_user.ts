import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envFile = fs.readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
for (const line of envFile.split('\n')) {
    if (line.includes('=')) {
        const [k, ...v] = line.split('=');
        env[k.trim()] = v.join('=').trim().replace(/^"|"$/g, '');
    }
}

const supabaseAdmin = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkUser() {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error) {
        console.error("Error fetching users:", error);
        return;
    }

    const user = data.users.find((u: any) => u.email === 'luisaponteblanco@gmail.com');
    if (user) {
        console.log("Current user:", JSON.stringify({
            id: user.id,
            email: user.email,
            email_confirmed_at: user.email_confirmed_at,
            confirmed_at: user.confirmed_at,
            last_sign_in_at: user.last_sign_in_at,
            banned_until: user.banned_until
        }, null, 2));

        // Let's force update password and confirm
        const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
            password: "Password123!",
            email_confirm: true
        });

        if (updateError) {
             console.error("Update error:", updateError);
        } else {
             console.log("User forced to confirmed and password reset to: Password123!");
        }

    } else {
        console.log("User not found in auth.users.");
    }
}

checkUser();
