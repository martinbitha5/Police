/**
 * Corrige les 4 repos autonomes :
 * - Supprime les workspaces npm (cause d'échec sur Hostinger)
 * - Met les fichiers shared dans src/shared/ directement
 * - Mappe @police/shared → ./src/shared via tsconfig paths
 * - Met à jour Next.js vers 15.3.3 (patch sécurité CVE-2025-66478)
 * - Commit + push
 */
import { writeFileSync, mkdirSync, cpSync, rmSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const DESK   = 'C:/Users/GOBLAIRE/Desktop';
const SHARED = 'C:/Users/GOBLAIRE/Desktop/police/packages/shared/src';

const apps = [
  {
    name: 'web', port: 3000,
    deps: {
      '@supabase/ssr': '^0.5.2',
      '@supabase/supabase-js': '^2.47.10',
      'exceljs': '^4.4.0',
      'next': '15.3.3',
      'react': '^19.0.0',
      'react-dom': '^19.0.0',
    },
  },
  {
    name: 'tracking', port: 3002,
    deps: {
      '@supabase/supabase-js': '^2.47.10',
      'lottie-react': '^2.4.0',
      'next': '15.3.3',
      'react': '^19.0.0',
      'react-dom': '^19.0.0',
    },
  },
  {
    name: 'litige', port: 3003,
    deps: {
      '@supabase/ssr': '^0.5.2',
      '@supabase/supabase-js': '^2.47.10',
      'exceljs': '^4.4.0',
      'next': '15.3.3',
      'react': '^19.0.0',
      'react-dom': '^19.0.0',
    },
  },
  {
    name: 'vols', port: 3004,
    deps: {
      '@supabase/supabase-js': '^2.47.10',
      'next': '15.3.3',
      'react': '^19.0.0',
      'react-dom': '^19.0.0',
    },
  },
];

for (const app of apps) {
  const repo = join(DESK, `police-${app.name}-repo`);
  console.log(`\n── ${app.name} ──────────────────────────`);

  // 1. Supprime packages/shared (plus besoin de workspace)
  const pkgShared = join(repo, 'packages');
  if (existsSync(pkgShared)) rmSync(pkgShared, { recursive: true, force: true });

  // 2. Copie shared dans src/shared/
  const sharedDst = join(repo, 'src', 'shared');
  mkdirSync(sharedDst, { recursive: true });
  cpSync(SHARED, sharedDst, { recursive: true });
  console.log('  shared copié dans src/shared/');

  // 3. package.json sans workspaces
  const pkg = {
    name: `@police/${app.name}`,
    version: '1.0.0',
    private: true,
    scripts: {
      dev:       `next dev -p ${app.port}`,
      build:     'next build',
      start:     `next start -p ${app.port}`,
      typecheck: 'tsc --noEmit',
    },
    dependencies: app.deps,
    devDependencies: {
      '@types/node': '^22.10.2',
      '@types/react': '^19.0.0',
      '@types/react-dom': '^19.0.0',
      'typescript': '^5.7.2',
    },
  };
  writeFileSync(join(repo, 'package.json'), JSON.stringify(pkg, null, 2));
  console.log('  package.json sans workspaces');

  // 4. tsconfig.json — ajoute le path @police/shared → ./src/shared
  const tsconfig = {
    compilerOptions: {
      target: 'ES2022',
      lib: ['dom', 'dom.iterable', 'ES2022'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'ESNext',
      moduleResolution: 'Bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'preserve',
      incremental: true,
      plugins: [{ name: 'next' }],
      paths: {
        '@/*': ['./src/*'],
        '@police/shared': ['./src/shared/index.ts'],
      },
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules'],
  };
  writeFileSync(join(repo, 'tsconfig.json'), JSON.stringify(tsconfig, null, 2));
  console.log('  tsconfig.json avec paths @police/shared');

  // 5. next.config.js — sans transpilePackages (shared est maintenant local)
  const nextCfg = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.jsx': ['.tsx', '.jsx'],
    };
    return config;
  },
};

module.exports = nextConfig;
`;
  writeFileSync(join(repo, 'next.config.js'), nextCfg);
  console.log('  next.config.js simplifié');

  // 6. Git commit + push
  const run = (cmd) => execSync(cmd, { cwd: repo, stdio: 'inherit' });
  run('git add -A');
  run('git commit -m "Fix: shared inline, pas de workspaces, Next.js 15.3.3"');
  run('git push');
  console.log(`  git push OK`);
}

console.log('\nTous les repos mis à jour.');
