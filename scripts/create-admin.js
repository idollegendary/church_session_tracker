require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

(async () => {
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!SUPABASE_URL || !SRK) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(2);
  }

  const username = process.env.ADMIN_USERNAME || '1337';
  const password = process.env.ADMIN_PASSWORD || '1337';
  const email = `${username}@local`;

  try {
    const url = `${SUPABASE_URL.replace(/\/$/, '')}/auth/v1/admin/users`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SRK}`,
        apikey: SRK,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password, email_confirm: true })
    });
    const json = await res.json().catch(() => ({}));
    if (res.status === 409) {
      console.log('Admin user already exists:', email);
      process.exit(0);
    }
    if (!res.ok) {
      console.error('Failed to create admin user:', res.status, json || await res.text());
      process.exit(1);
    }
    console.log('Admin user created:', email);
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin user:', err);
    process.exit(1);
  }
})();
