/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
