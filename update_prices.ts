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
    // 1. Get current plans
    const { data: plans, error: fetchErr } = await supabaseAdmin.from('plans').select('*');
    if (fetchErr) {
        console.error("Error fetching plans:", fetchErr);
        return;
    }
    console.log("Current plans:", plans.map(p => p.name));

    // We will use price_id temporarily to store the price numeric value if we don't want to alter table,
    // OR we can use the JSONB features field to store price, e.g. features: { ..., price: 8000 }
    // Let's just use features.price to avoid DDL.
    for (const plan of plans) {
        let features = plan.features || {};
        let price = 0;
        
        if (plan.name === 'Pro Mensual' || plan.name === 'Pro') {
            price = 8000;
        } else if (plan.name === 'Pro Semestral') {
            price = 45000; // un poco de descuento, o 48000
        } else if (plan.name === 'Pro Anual') {
            price = 85000; // descuento sobre 96000
        }

        features.price = price;

        await supabaseAdmin.from('plans').update({ features }).eq('id', plan.id);
        console.log(`Updated ${plan.name} with price ${price}`);
    }
}

setupPrices();
