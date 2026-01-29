require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

(async () => {
  const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
  const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!SUPABASE_URL || !SRK) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(2);
  }

  try {
    const url = `${SUPABASE_URL}/rest/v1/admins?select=*`;
    const res = await fetch(url, {
      headers: {
        apikey: SRK,
        Authorization: `Bearer ${SRK}`
      }
    });
    const text = await res.text();
    console.log('status', res.status);
    console.log(text);
  } catch (err) {
    console.error('fetch error', err);
    process.exit(1);
  }
})();
