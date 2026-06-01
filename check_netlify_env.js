const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  try {
    console.log("Fetching index html...");
    const html = await fetchUrl('https://personalesmisfinanzas.netlify.app/');
    
    // Match scripts like "/_next/static/chunks/..."
    const regex = /src="(\/_next\/static\/chunks\/[^"]+)"/g;
    let match;
    const scripts = [];
    while ((match = regex.exec(html)) !== null) {
      scripts.push(match[1]);
    }
    
    console.log(`Found ${scripts.length} scripts. Checking for supabase URLs...`);
    
    for (const script of scripts) {
      const scriptUrl = 'https://personalesmisfinanzas.netlify.app' + script;
      const content = await fetchUrl(scriptUrl);
      
      const matches = content.match(/https:\/\/[a-zA-Z0-9-]+\.supabase\.co/g);
      if (matches) {
        console.log(`\nFound Supabase URLs in ${script}:`);
        console.log(Array.from(new Set(matches)));
      }
      
      const keyMatches = content.match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9-_\.]+/g);
      if (keyMatches) {
        console.log(`Found JWT tokens (anon keys) in ${script}:`);
        console.log(keyMatches.map(k => k.substring(0, 30) + "..."));
      }
    }
    console.log("\nScan complete.");
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
