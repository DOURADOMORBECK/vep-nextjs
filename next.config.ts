import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: {
    // Disable ESLint during builds temporarily to deploy
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Also ignore TypeScript errors temporarily
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
