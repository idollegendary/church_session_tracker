require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const POSTGRES_URL = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
if (!POSTGRES_URL) {
  console.error('Missing POSTGRES_URL in environment (.env.local)');
  process.exit(2);
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

(async () => {
  const client = new Client({ connectionString: POSTGRES_URL, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log('Connected to Postgres. Checking for avatar_url column...');
    const res = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='preachers';`);
    const cols = res.rows.map(r => r.column_name);
    console.log('Columns on public.preachers:', cols.join(', '));
    if (!cols.includes('avatar_url')) {
      console.log('avatar_url missing — adding column avatar_url text');
      await client.query(`ALTER TABLE public.preachers ADD COLUMN IF NOT EXISTS avatar_url text;`);
      console.log('ALTER TABLE executed. Verifying...');
      const res2 = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='preachers';`);
      console.log('Now columns:', res2.rows.map(r => r.column_name).join(', '));
    } else {
      console.log('avatar_url already exists — nothing to do.');
    }
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    try { await client.end(); } catch (e) {}
    process.exit(3);
  }
})();
