import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true, // Enables React's Strict Mode
  swcMinify: true, // Enables SWC-based minification
  images: {
    domains: ['example.com'],
  },
  async redirects() {
    return [
      {
        source: '/old-page',
        destination: '/new-page',
        permanent: true,
      },
    ];
  },
  i18n: {
    locales: ['en', 'fr'],
    defaultLocale: 'en',
  },
  env: {
    API_URL: process.env.API_URL,
  },
  webpack(config) {
    // Custom Webpack configuration
    return config;
  },
};

export default nextConfig;
