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
  // Performance optimizations
  images: {
    formats: ['image/webp', 'image/avif'], // Modern formats for better performance
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'app.beagleforpm.com',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Enable React compiler optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@tanstack/react-query'],
  },
  // Compress responses
  compress: true,
  // Enable production source maps for debugging if needed
  productionBrowserSourceMaps: false,
  // Power optimizations
  poweredByHeader: false,
};

export default nextConfig;
