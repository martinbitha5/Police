// Crée un compte agent de test via l'API admin Supabase.
// La clé service_role est lue depuis packages/api/.env (jamais en dur ici).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));

function readEnv(path) {
  const out = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].trim();
  }
  return out;
}

const env = readEnv(resolve(__dirname, '../packages/api/.env'));
const url = env.SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant dans packages/api/.env');
  process.exit(1);
}

const account = {
  email: process.argv[2] ?? 'agent@airport.com',
  password: process.argv[3] ?? 'agent1234',
  full_name: process.argv[4] ?? 'Jean Mukeba',
  gate: process.argv[5] ?? 'Gate 3',
};

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data, error } = await supabase.auth.admin.createUser({
  email: account.email,
  password: account.password,
  email_confirm: true,
  user_metadata: { full_name: account.full_name, role: 'agent', gate: account.gate },
});

if (error) {
  console.error('Échec création:', error.message);
  process.exit(1);
}

console.log('✅ Compte agent créé');
console.log('   id    :', data.user.id);
console.log('   email :', account.email);
console.log('   mot de passe :', account.password);
console.log('   nom   :', account.full_name);
console.log('   gate  :', account.gate);
