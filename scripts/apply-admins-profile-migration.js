require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const POSTGRES_URL = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
if (!POSTGRES_URL) {
  console.error('Missing POSTGRES_URL in environment (.env.local)');
  process.exit(2);
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '005_admins_profile.sql');
if (!fs.existsSync(sqlPath)) {
  console.error('Migration file not found:', sqlPath);
  process.exit(2);
}

(async () => {
  const client = new Client({ connectionString: POSTGRES_URL, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('Applying admins profile migration...');
    await client.query(sql);
    console.log('Admins profile migration applied.');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Failed to apply admins profile migration:', err);
    try { await client.end(); } catch (e) {}
    process.exit(1);
  }
})();
