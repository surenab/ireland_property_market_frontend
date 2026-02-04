import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Disable image optimization for now
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
