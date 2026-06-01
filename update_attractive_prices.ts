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
        let price = 0;
        
        if (plan.name === 'Pro Mensual' || plan.name === 'Pro') {
            price = 8000;
        } else if (plan.name === 'Pro Semestral') {
            price = 39900; // Psychological pricing (was 48000 -> 39900) saves 17%
        } else if (plan.name === 'Pro Anual') {
            price = 69900; // Psychological pricing (was 96000 -> 69900) saves 27%
        }

        features.price = price;

        await supabaseAdmin.from('plans').update({ features }).eq('id', plan.id);
        console.log(`Updated ${plan.name} with attractive price ${price}`);
    }
}

setupPrices();
