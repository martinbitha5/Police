/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname, '../..'),
  transpilePackages: ['@police/shared'],
  webpack: (config) => {
    // Les paquets workspace en TS (ESM NodeNext) importent avec l'extension `.js`
    // (ex. `export * from './types.js'`) alors que les fichiers réels sont `.ts`.
    // On dit au resolver webpack de tenter `.ts`/`.tsx` avant `.js`.
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      '.jsx': ['.tsx', '.jsx'],
    };
    return config;
  },
};

module.exports = nextConfig;
