/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@frontend/core',
    '@frontend/design-system'
  ],
  experimental: {
    instrumentationHook: false
  },
  output: 'standalone'
};

module.exports = nextConfig;
