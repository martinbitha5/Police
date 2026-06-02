import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(__dirname, '..', 'supabase', 'bootstrap.sql'), 'utf8');

const REF = process.env.SUPABASE_REF;
const PASSWORD = process.env.SUPABASE_DB_PASSWORD;

const candidates = [
  { label: 'direct', host: `db.${REF}.supabase.co`, port: 5432, user: 'postgres' },
  { label: 'pooler-eu-west-3', host: 'aws-0-eu-west-3.pooler.supabase.com', port: 5432, user: `postgres.${REF}` },
  { label: 'pooler-eu-central-1', host: 'aws-0-eu-central-1.pooler.supabase.com', port: 5432, user: `postgres.${REF}` },
  { label: 'pooler-us-east-1', host: 'aws-0-us-east-1.pooler.supabase.com', port: 5432, user: `postgres.${REF}` },
];

for (const c of candidates) {
  const client = new pg.Client({
    host: c.host,
    port: c.port,
    user: c.user,
    password: PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });
  try {
    await client.connect();
    console.log(`Connecté via ${c.label} (${c.host})`);
    await client.query(sql);
    console.log('Bootstrap appliqué avec succès.');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.log(`Échec ${c.label}: ${err.message}`);
    try { await client.end(); } catch {}
  }
}

console.error('Aucune route de connexion n a fonctionné.');
process.exit(1);
