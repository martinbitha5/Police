// Vérification d'intégrité — LECTURE SEULE, n'écrit rien.
// Réconcilie passagers ↔ bagages ↔ alertes et signale toute incohérence
// pour donner une certitude 100 % que le système est cohérent.
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
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const [{ data: passengers }, { data: baggage }, { data: alerts }] = await Promise.all([
  supabase.from('passengers').select('id, flight_id, full_name, pnr, seat, declared_baggage_count'),
  supabase.from('baggage').select('id, passenger_id, flight_id, serial_number, tag_number, is_confirmed'),
  supabase.from('fraud_alerts').select('id, resolved, reason'),
]);

const bagsByPax = new Map();
for (const b of baggage ?? []) {
  if (!bagsByPax.has(b.passenger_id)) bagsByPax.set(b.passenger_id, []);
  bagsByPax.get(b.passenger_id).push(b);
}

let problems = 0;
const warn = (msg) => { problems++; console.log('  ❌', msg); };

console.log('═══ 1. Passagers : declared_baggage_count vs lignes baggage pré-inscrites ═══');
for (const p of passengers ?? []) {
  const bags = bagsByPax.get(p.id) ?? [];
  const confirmed = bags.filter((b) => b.is_confirmed).length;
  if (bags.length !== p.declared_baggage_count) {
    warn(`${p.full_name} (siège ${p.seat}) : declared=${p.declared_baggage_count} mais ${bags.length} ligne(s) baggage`);
  }
  if (confirmed > p.declared_baggage_count) {
    warn(`${p.full_name} : ${confirmed} confirmés > ${p.declared_baggage_count} déclarés (quota dépassé en base!)`);
  }
}

console.log('\n═══ 2. Contrainte unicité (flight_id, pnr, seat) ═══');
const seen = new Set();
for (const p of passengers ?? []) {
  const key = `${p.flight_id}|${p.pnr}|${p.seat}`;
  if (seen.has(key)) warn(`Doublon (flight,pnr,seat) : ${p.full_name} ${key}`);
  seen.add(key);
}

console.log('\n═══ 3. Bagages orphelins (passenger_id introuvable) ═══');
const paxIds = new Set((passengers ?? []).map((p) => p.id));
for (const b of baggage ?? []) {
  if (b.passenger_id && !paxIds.has(b.passenger_id)) warn(`Bagage ${b.tag_number} → passenger_id fantôme`);
  if (b.is_confirmed && (b.tag_number?.length !== 10)) warn(`Bagage confirmé tag_number non-10-chiffres: ${b.tag_number}`);
}

console.log('\n═══ 4. Cohérence vol bagage = vol passager ═══');
const paxFlight = new Map((passengers ?? []).map((p) => [p.id, p.flight_id]));
for (const b of baggage ?? []) {
  if (b.passenger_id && paxFlight.get(b.passenger_id) !== b.flight_id) {
    warn(`Bagage ${b.tag_number} flight_id ≠ flight_id du passager`);
  }
}

const totalDeclared = (passengers ?? []).reduce((s, p) => s + (p.declared_baggage_count ?? 0), 0);
const totalRows = (baggage ?? []).length;
const totalConfirmed = (baggage ?? []).filter((b) => b.is_confirmed).length;
const unresolved = (alerts ?? []).filter((a) => !a.resolved).length;

console.log('\n═══ RÉSUMÉ ═══');
console.log(`Passagers              : ${passengers?.length ?? 0}`);
console.log(`Bagages déclarés (somme): ${totalDeclared}`);
console.log(`Lignes baggage en base : ${totalRows}  (attendu = ${totalDeclared})`);
console.log(`Bagages confirmés      : ${totalConfirmed} / ${totalRows}`);
console.log(`Alertes fraude non résolues : ${unresolved} / ${alerts?.length ?? 0}`);
console.log(`\n${problems === 0 ? '✅ AUCUNE incohérence détectée.' : `⚠️  ${problems} incohérence(s) ci-dessus.`}`);
