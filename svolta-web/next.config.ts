import type { NextConfig } from 'next';
const config: NextConfig = {
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  devIndicators: false,
  async redirects() { return [{ source: '/favicon.ico', destination: '/brand/circular.png', permanent: true }]; },
};
export default config;
