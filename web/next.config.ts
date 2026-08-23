import type { NextConfig } from 'next';

// Minimal by design. No image domains, no rewrites, no experimental flags:
// nothing here should need to change for the portfolio MVP.
const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
