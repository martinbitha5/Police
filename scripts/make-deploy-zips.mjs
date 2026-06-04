/**
 * Crée les archives .tgz de déploiement Hostinger pour les 4 web apps.
 * Aucune dépendance externe — modules natifs Node.js uniquement.
 * Contourne la limite MAX_PATH de PowerShell Compress-Archive.
 *
 * Usage : node scripts/make-deploy-zips.mjs
 */
import { createWriteStream, readdirSync, statSync, readFileSync, mkdirSync } from 'fs';
import { join, relative } from 'path';
import zlib from 'zlib';

const ROOT   = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
const DEPLOY = join(ROOT, 'deploy');
mkdirSync(DEPLOY, { recursive: true });

const APPS = [
  { name: 'web',      port: 3000 },
  { name: 'tracking', port: 3002 },
  { name: 'litige',   port: 3003 },
  { name: 'vols',     port: 3004 },
];

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function makeTgz(srcDir, destFile) {
  return new Promise((resolve, reject) => {
    const gz  = zlib.createGzip({ level: 6 });
    const out = createWriteStream(destFile);
    gz.pipe(out);
    out.on('finish', resolve);
    out.on('error', reject);
    gz.on('error', reject);

    const files = walk(srcDir);

    function writeHeader(name, size, mtime) {
      const buf = Buffer.alloc(512, 0);
      const n   = name.slice(0, 100);
      buf.write(n, 0, 'utf8');
      const w = (v, off, len) => buf.write(v.toString(8).padStart(len - 1, '0') + ' ', off, 'ascii');
      w(0o644,                         100, 8);
      w(0,                             108, 8);
      w(0,                             116, 8);
      w(size,                          124, 12);
      w(Math.floor(mtime / 1000),      136, 12);
      buf.write(' '.repeat(8),         148, 'ascii');
      buf.write('0',                   156, 'ascii');
      buf.write('ustar  \0',           257, 'ascii');
      let chk = 0;
      for (let i = 0; i < 512; i++) chk += buf[i];
      buf.write(chk.toString(8).padStart(6, '0') + '\0 ', 148, 'ascii');
      return buf;
    }

    for (const filePath of files) {
      const rel  = relative(srcDir, filePath).replace(/\\/g, '/');
      const data = readFileSync(filePath);
      const stat = statSync(filePath);
      gz.write(writeHeader(rel, data.length, stat.mtimeMs));
      gz.write(data);
      const pad = 512 - (data.length % 512);
      if (pad < 512) gz.write(Buffer.alloc(pad, 0));
    }

    gz.write(Buffer.alloc(1024, 0)); // end-of-archive
    gz.end();
  });
}

for (const app of APPS) {
  const srcDir  = join(ROOT, 'apps', app.name, '.next', 'standalone');
  const outFile = join(DEPLOY, `${app.name}.tgz`);
  process.stdout.write(`  ${app.name} (port ${app.port})… `);
  const t = Date.now();
  await makeTgz(srcDir, outFile);
  const mb = (statSync(outFile).size / 1024 / 1024).toFixed(1);
  console.log(`${mb} Mo  (${((Date.now() - t) / 1000).toFixed(1)} s)`);
}

console.log(`\nTous les fichiers sont dans : ${DEPLOY}`);
