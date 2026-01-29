require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');
const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

(async () => {
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!SUPABASE_URL || !SRK) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(2);
  }

  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || '1337';
  const display_name = process.env.ADMIN_DISPLAY_NAME || 'Admin';
  const avatar_url = process.env.ADMIN_AVATAR_URL || '';
  const { salt, hash } = hashPassword(password);

  try {
    const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/admins`;
    const body = { username, password_salt: salt, password_hash: hash, display_name, avatar_url };
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SRK}`,
        apikey: SRK,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates'
      },
      body: JSON.stringify(body)
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 409 || (json && json.code === 'duplicate')) {
        console.log('Admin already exists; attempting update...');
        // try update
        const upd = await fetch(url + `?username=eq.${encodeURIComponent(username)}`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${SRK}`,
            apikey: SRK,
            'Content-Type': 'application/json',
            Prefer: 'return=representation'
          },
          body: JSON.stringify(body)
        });
        const uj = await upd.json().catch(() => ({}));
        if (!upd.ok) {
          console.error('Failed to update existing admin:', upd.status, uj);
          process.exit(1);
        }
        console.log('Admin updated:', username);
        process.exit(0);
      }
      console.error('Failed to create admin user:', res.status, json || await res.text());
      process.exit(1);
    }
    console.log('Admin user created/inserted:', username);
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin user:', err);
    process.exit(1);
  }
})();
