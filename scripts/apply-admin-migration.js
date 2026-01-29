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

const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '004_admins.sql');
if (!fs.existsSync(sqlPath)) {
  console.error('Migration file not found:', sqlPath);
  process.exit(2);
}

(async () => {
  const client = new Client({ connectionString: POSTGRES_URL, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const sql = fs.readFileSync(sqlPath, 'utf8');
    console.log('Applying admin migration...');
    await client.query(sql);
    console.log('Admin migration applied.');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Failed to apply admin migration:', err);
    try { await client.end(); } catch (e) {}
    process.exit(1);
  }
})();
