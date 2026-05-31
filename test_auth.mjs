import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rsznupaciwfpzognelna.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzem51cGFjaXdmcHpvZ25lbG5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ5MDkzNjcsImV4cCI6MjA5MDQ4NTM2N30.3-GMNAQ2K5cv1aQGbkLCDcll-j2vd1AzVTndhx_qzzY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
  const email = `testuser_${Date.now()}@example.com`;
  const password = 'Password123!';

  console.log('--- Testing Sign Up ---');
  const signUpRes = await supabase.auth.signUp({
    email,
    password,
  });
  console.log('SignUp Data:', JSON.stringify(signUpRes.data, null, 2));
  if (signUpRes.error) console.error('SignUp Error:', signUpRes.error);

  console.log('\n--- Testing Sign In ---');
  const signInRes = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  console.log('SignIn Session:', signInRes.data.session ? 'Created' : 'Null');
  if (signInRes.error) console.error('SignIn Error:', signInRes.error);

  console.log('\n--- Checking Profiles Table ---');
  if (signUpRes.data.user) {
    const profileRes = await supabase.from('profiles').select('*').eq('id', signUpRes.data.user.id);
    console.log('Profile Data:', profileRes.data);
    if (profileRes.error) console.error('Profile Error:', profileRes.error);
  }
}

testAuth();
