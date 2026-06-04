/**
 * Écrit les fichiers de config (package.json, next.config.js, .gitignore, .env.example,
 * packages/shared/package.json) dans chaque repo autonome.
 */
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const DESK = 'C:/Users/GOBLAIRE/Desktop';

const SHARED_PKG = JSON.stringify({
  name: '@police/shared',
  version: '0.1.0',
  private: true,
  type: 'module',
  main: './src/index.ts',
  types: './src/index.ts',
  exports: { '.': './src/index.ts' },
}, null, 2);

const GITIGNORE = `node_modules/
.next/
.turbo/
*.tsbuildinfo
.env
.env.local
.DS_Store
`;

const NEXT_CONFIG = (port) => `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@police/shared'],
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

const apps = [
  {
    name: 'web', port: 3000,
    deps: {
      '@police/shared': '*',
      '@supabase/ssr': '^0.5.2',
      '@supabase/supabase-js': '^2.47.10',
      'exceljs': '^4.4.0',
      'next': '15.1.3',
      'react': '^19.0.0',
      'react-dom': '^19.0.0',
    },
    env: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_HUB', 'SUPABASE_SERVICE_ROLE_KEY'],
    envExample: `NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key\nNEXT_PUBLIC_HUB=FIH\nSUPABASE_SERVICE_ROLE_KEY=your-service-role-key\n`,
  },
  {
    name: 'tracking', port: 3002,
    deps: {
      '@police/shared': '*',
      '@supabase/supabase-js': '^2.47.10',
      'lottie-react': '^2.4.0',
      'next': '15.1.3',
      'react': '^19.0.0',
      'react-dom': '^19.0.0',
    },
    env: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
    envExample: `NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key\nSUPABASE_SERVICE_ROLE_KEY=your-service-role-key\n`,
  },
  {
    name: 'litige', port: 3003,
    deps: {
      '@police/shared': '*',
      '@supabase/ssr': '^0.5.2',
      '@supabase/supabase-js': '^2.47.10',
      'exceljs': '^4.4.0',
      'next': '15.1.3',
      'react': '^19.0.0',
      'react-dom': '^19.0.0',
    },
    env: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_HUB', 'SUPABASE_SERVICE_ROLE_KEY'],
    envExample: `NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key\nNEXT_PUBLIC_HUB=FIH\nSUPABASE_SERVICE_ROLE_KEY=your-service-role-key\n`,
  },
  {
    name: 'vols', port: 3004,
    deps: {
      '@police/shared': '*',
      '@supabase/supabase-js': '^2.47.10',
      'next': '15.1.3',
      'react': '^19.0.0',
      'react-dom': '^19.0.0',
    },
    env: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_HUB', 'SUPABASE_SERVICE_ROLE_KEY'],
    envExample: `NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\nNEXT_PUBLIC_HUB=FIH\nSUPABASE_SERVICE_ROLE_KEY=your-service-role-key\n`,
  },
];

for (const app of apps) {
  const repo = join(DESK, `police-${app.name}-repo`);

  // packages/shared/package.json
  const sharedDir = join(repo, 'packages', 'shared');
  mkdirSync(sharedDir, { recursive: true });
  writeFileSync(join(sharedDir, 'package.json'), SHARED_PKG);

  // root package.json
  const pkg = {
    name: `@police/${app.name}`,
    version: '0.1.0',
    private: true,
    scripts: {
      dev:       `next dev -p ${app.port}`,
      build:     'next build',
      start:     `next start -p ${app.port}`,
      typecheck: 'tsc --noEmit',
    },
    workspaces: ['packages/shared'],
    dependencies: app.deps,
    devDependencies: {
      '@types/node': '^22.10.2',
      '@types/react': '^19.0.0',
      '@types/react-dom': '^19.0.0',
      'typescript': '^5.7.2',
    },
  };
  writeFileSync(join(repo, 'package.json'), JSON.stringify(pkg, null, 2));

  // next.config.js
  writeFileSync(join(repo, 'next.config.js'), NEXT_CONFIG(app.port));

  // .gitignore
  writeFileSync(join(repo, '.gitignore'), GITIGNORE);

  // .env.example
  writeFileSync(join(repo, '.env.example'), app.envExample);

  console.log(`Config écrite -> police-${app.name}-repo`);
}
