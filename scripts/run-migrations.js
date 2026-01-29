require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const POSTGRES_URL = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL;
if (!POSTGRES_URL) {
  console.error('Missing POSTGRES_URL in environment (.env.local)');
  process.exit(2);
}

// For testing in environments with custom/self-signed TLS certs, allow insecure TLS.
// WARNING: this weakens security; do NOT use in production.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
if (!fs.existsSync(migrationsDir)) {
  console.error('Migrations directory not found:', migrationsDir);
  process.exit(2);
}

const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
if (!files.length) {
  console.log('No migration files found in', migrationsDir);
  process.exit(0);
}

(async () => {
  const client = new Client({ connectionString: POSTGRES_URL, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log('Connected to Postgres. Running migrations:');
    for (const f of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, f), 'utf8');
      console.log('--- Running', f);
      await client.query(sql);
      console.log('OK', f);
    }
    console.log('All migrations applied.');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    try { await client.end(); } catch (e) {}
    process.exit(3);
  }
})();
