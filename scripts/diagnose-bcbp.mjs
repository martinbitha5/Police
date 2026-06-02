// Diagnostic : décode les raw_bcbp stockés pour voir où vivent réellement
// le PNR et le nombre de bagages. Lecture seule, aucune écriture.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { decode } from 'bcbp';

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

const { data, error } = await supabase
  .from('passengers')
  .select('full_name, pnr, declared_baggage_count, raw_bcbp')
  .order('scanned_at', { ascending: false })
  .limit(8);

if (error) {
  console.error('Erreur lecture passengers:', error.message);
  process.exit(1);
}

if (!data.length) {
  console.log('Aucun passager en base.');
  process.exit(0);
}

for (const p of data) {
  console.log('\n════════════════════════════════════════');
  console.log('DB full_name :', p.full_name);
  console.log('DB pnr       :', JSON.stringify(p.pnr));
  console.log('DB declared  :', p.declared_baggage_count);
  try {
    const d = decode(p.raw_bcbp);
    const leg = d.data?.legs?.[0] ?? {};
    console.log('  → passengerName            :', JSON.stringify(d.data?.passengerName));
    console.log('  → leg.operatingCarrierPNR  :', JSON.stringify(leg.operatingCarrierPNR));
    console.log('  → leg.seatNumber           :', JSON.stringify(leg.seatNumber));
    console.log('  → leg.checkInSequenceNumber:', JSON.stringify(leg.checkInSequenceNumber));
    console.log('  → leg.freeBaggageAllowance :', JSON.stringify(leg.freeBaggageAllowance));
    console.log('  → data.baggageTagNumber    :', JSON.stringify(d.data?.baggageTagNumber));
    console.log('  → data.firstBaggageTagNumber :', JSON.stringify(d.data?.firstBaggageTagNumber));
    console.log('  → data.secondBaggageTagNumber:', JSON.stringify(d.data?.secondBaggageTagNumber));
    console.log('  → RAW                      :', JSON.stringify(p.raw_bcbp));
  } catch (e) {
    console.log('  → décodage échoué:', e.message);
  }
}
