/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@frontend/core',
    '@frontend/design-system'
  ]
};

module.exports = nextConfig;
