require('dotenv').config({ path: '.env.local' });
const fetch = globalThis.fetch || require('node-fetch');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment (.env.local)');
  process.exit(2);
}

async function tryQuery(path) {
  const url = `${SUPABASE_URL}/rest/v1/${path}?select=*&limit=5`;
  try {
    const res = await fetch(url, {
      headers: {
        apikey: SERVICE_ROLE,
        Authorization: `Bearer ${SERVICE_ROLE}`,
        Accept: 'application/json'
      }
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { data = text; }
    return { status: res.status, ok: res.ok, data };
  } catch (err) {
    return { error: String(err) };
  }
}

(async () => {
  console.log('Testing connection to', SUPABASE_URL);

  console.log('\nTrying `preachers` table...');
  let r = await tryQuery('preachers');
  if (r.ok) {
    console.log('Success: received rows from `preachers` (up to 5):');
    console.log(JSON.stringify(r.data, null, 2));
    process.exit(0);
  }

  console.log('preachers query failed:', { status: r.status, ok: r.ok, error: r.error });

  console.log('\nTrying `sessions` table...');
  r = await tryQuery('sessions');
  if (r.ok) {
    console.log('Success: received rows from `sessions` (up to 5):');
    console.log(JSON.stringify(r.data, null, 2));
    process.exit(0);
  }

  console.log('sessions query failed:', { status: r.status, ok: r.ok, error: r.error });

  console.error('\nAll test queries failed. Check that the service role key is correct and RLS/Policies allow reads via the service key.');
  process.exit(3);
})();
