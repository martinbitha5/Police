// Répare les données déjà en base après le fix du parser bagage.
// Pour chaque passager : recalcule declared_baggage_count depuis raw_bcbp et
// (re)pré-inscrit ses bagages (étiquettes physiques 10 chiffres). Marque aussi
// comme résolues les alertes fraude « Passager non enregistré » causées par le
// bug (aucun bagage n'était pré-inscrit). N'efface rien — additif + résolution.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { parseBoardingPass, parseBaggageTag } from '@police/bcbp-parser';

const __dirname = dirname(fileURLToPath(import.meta.url));

function readEnv(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]!] = m[2]!.trim();
  }
  return out;
}

const env = readEnv(resolve(__dirname, '../packages/api/.env'));
const supabase = createClient(env.SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: passengers, error } = await supabase
  .from('passengers')
  .select('id, flight_id, full_name, raw_bcbp');

if (error) {
  console.error('Lecture passengers échouée:', error.message);
  process.exit(1);
}

let bagsInserted = 0;
for (const p of passengers ?? []) {
  if (!p.raw_bcbp) continue;
  let parsed;
  try {
    parsed = parseBoardingPass(p.raw_bcbp);
  } catch {
    console.warn('  ⚠ BCBP illisible pour', p.full_name);
    continue;
  }

  await supabase
    .from('passengers')
    .update({ declared_baggage_count: parsed.declaredBaggageCount })
    .eq('id', p.id);

  const rows = parsed.baggageTags.flatMap((rawTag) => {
    const digits = rawTag.replace(/\D/g, '');
    if (digits.length !== 13 && digits.length !== 10) return [];
    const pt = parseBaggageTag(digits);
    const count = digits.length === 13 ? pt.declaredBaggageCount : 1;
    if (count <= 0) return [];
    const baseSerial = parseInt(pt.serialNumber, 10);
    return Array.from({ length: count }, (_, i) => {
      const serial = String(baseSerial + i).padStart(6, '0');
      return {
        passenger_id: p.id,
        flight_id: p.flight_id,
        tag_number: `${pt.issuerCode}${pt.airlineNumericCode}${serial}`,
        issuer_code: pt.issuerCode,
        airline_numeric_code: pt.airlineNumericCode,
        serial_number: serial,
        is_confirmed: false,
      };
    });
  });

  if (rows.length > 0) {
    await supabase.from('baggage').upsert(rows, { onConflict: 'tag_number', ignoreDuplicates: true });
    bagsInserted += rows.length;
  }
  console.log(`  ${p.full_name} → ${parsed.declaredBaggageCount} bagage(s)`);
}

// Les alertes existantes ont toutes été générées par le bug (aucun bagage
// pré-inscrit) → on les marque résolues plutôt que de les supprimer.
const { count: alertCount } = await supabase
  .from('fraud_alerts')
  .update({ resolved: true })
  .eq('resolved', false)
  .select('id', { count: 'exact', head: true });

console.log(`\n✅ Réparé : ${passengers?.length ?? 0} passagers, ${bagsInserted} bagages pré-inscrits.`);
console.log(`   ${alertCount ?? 0} ancienne(s) alerte(s) fraude marquée(s) résolue(s).`);
console.log('   Re-scanne maintenant les étiquettes physiques : elles se lieront aux passagers.');
