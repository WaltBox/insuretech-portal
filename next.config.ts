import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Only run ESLint on these directories during production builds
    dirs: ['app', 'components', 'lib'],
    // Don't fail build on warnings
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Don't fail build on type errors during production builds
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
