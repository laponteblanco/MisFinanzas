import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envFile = fs.readFileSync(path.resolve('.env.local'), 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
    if (line.includes('=') && !line.startsWith('#')) {
        const [k, ...v] = line.split('=');
        env[k.trim()] = v.join('=').trim().replace(/^"|"$/g, '');
    }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log("Checking categories table...");
    const r1 = await supabase.from('categories').select('*').limit(1);
    console.log('categories query error:', r1.error);
    console.log('categories data:', r1.data);
    
    // Check if there is another table name?
    const r2 = await supabase.from('Categoria').select('*').limit(1);
    console.log('Categoria error:', r2.error);
}
run();
