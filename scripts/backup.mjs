#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// Sauvegarde logique indépendante de la base Supabase (DR-07, F-15).
//
// Fait un pg_dump (format custom, compressé) puis le chiffre avec openssl
// (AES-256, PBKDF2). Le résultat est un export hors plateforme : il reste
// exploitable même en cas de perte d'accès au compte Supabase.
//
// Secrets fournis UNIQUEMENT par variables d'environnement, jamais en dur :
//   SUPABASE_DB_URL   chaîne de connexion (Settings → Database → Connection string)
//   BACKUP_PASSPHRASE phrase secrète de chiffrement (obligatoire)
//
// Usage : node scripts/backup.mjs
// Pré-requis : pg_dump (client PostgreSQL 17) et openssl dans le PATH.
// ─────────────────────────────────────────────────────────────

import { spawnSync } from 'node:child_process';
import { mkdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dbUrl = process.env.SUPABASE_DB_URL;
const passphrase = process.env.BACKUP_PASSPHRASE;

if (!dbUrl) {
  console.error('Erreur : SUPABASE_DB_URL manquant. Voir docs/iso27001/07-politique-sauvegarde-dr.md');
  process.exit(1);
}
if (!passphrase) {
  console.error('Erreur : BACKUP_PASSPHRASE manquant (chiffrement obligatoire : la sauvegarde contient des données personnelles).');
  process.exit(1);
}

function have(bin) {
  const probe = spawnSync(bin, ['--version'], { encoding: 'utf8' });
  return !probe.error;
}
for (const bin of ['pg_dump', 'openssl']) {
  if (!have(bin)) {
    console.error(`Erreur : '${bin}' introuvable dans le PATH.`);
    process.exit(1);
  }
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'backups');
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const dumpFile = join(outDir, `police-${stamp}.dump`);
const encFile = `${dumpFile}.enc`;

console.log('1/3  pg_dump en cours...');
// Format custom (-Fc) : compressé et restaurable sélectivement avec pg_restore.
const dump = spawnSync('pg_dump', ['-Fc', '--no-owner', '--no-privileges', '-f', dumpFile, dbUrl], {
  stdio: ['ignore', 'inherit', 'inherit'],
});
if (dump.status !== 0) {
  console.error('Échec de pg_dump.');
  process.exit(1);
}

console.log('2/3  chiffrement AES-256...');
const enc = spawnSync(
  'openssl',
  ['enc', '-aes-256-cbc', '-pbkdf2', '-salt', '-in', dumpFile, '-out', encFile, '-pass', 'env:BACKUP_PASSPHRASE'],
  { stdio: ['ignore', 'inherit', 'inherit'] },
);
if (enc.status !== 0) {
  console.error('Échec du chiffrement.');
  process.exit(1);
}

// On retire le dump en clair : seule la version chiffrée est conservée.
spawnSync(process.platform === 'win32' ? 'cmd' : 'rm', process.platform === 'win32' ? ['/c', 'del', dumpFile] : ['-f', dumpFile]);

const size = statSync(encFile).size;
if (size === 0) {
  console.error('Erreur : sauvegarde vide.');
  process.exit(1);
}
console.log(`3/3  OK. Sauvegarde chiffrée : ${encFile} (${(size / 1024 / 1024).toFixed(2)} Mo)`);
console.log('Déchiffrer : openssl enc -d -aes-256-cbc -pbkdf2 -in <fichier>.enc -out restore.dump -pass env:BACKUP_PASSPHRASE');
console.log('Restaurer (cible ISOLÉE) : pg_restore --clean --if-exists --no-owner --no-privileges -d "$CIBLE_DB_URL" restore.dump');
console.log('IMPORTANT : ne jamais restaurer sur la production. Copier ce fichier hors plateforme.');
