/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Monorepo : tracer les dépendances depuis la racine pour embarquer @police/shared.
  outputFileTracingRoot: path.join(__dirname, '../..'),
  transpilePackages: ['@police/shared'],
  webpack: (config) => {
    // Les paquets workspace en TS (ESM NodeNext) importent avec l'extension `.js`
    // alors que les fichiers réels sont `.ts`. On dit au resolver d'essayer `.ts`/`.tsx` d'abord.
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.jsx': ['.tsx', '.jsx'],
    };
    return config;
  },
};

module.exports = nextConfig;
