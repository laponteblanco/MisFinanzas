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

async function setupPrices() {
    const { data: plans, error: fetchErr } = await supabaseAdmin.from('plans').select('*');
    if (fetchErr) {
        console.error("Error fetching plans:", fetchErr);
        return;
    }

    for (const plan of plans) {
        let features = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features || {};
        
        if (plan.name === 'Pro Anual') {
            // Un 40% de descuento sobre 96.000 es 57.600. Lo dejaremos en 57.900 para que sea mas atractivo.
            features.price = 57900; 
            await supabaseAdmin.from('plans').update({ features }).eq('id', plan.id);
            console.log(`Updated ${plan.name} with attractive price ${features.price} (40% OFF)`);
        }
    }
}

setupPrices();
