import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  reactStrictMode: true,
  // In dev only: proxy /api to backend when NEXT_PUBLIC_API_URL is unset (avoids CORS/network errors)
  async rewrites() {
    if (process.env.NODE_ENV !== "development") return [];
    const url = process.env.NEXT_PUBLIC_API_URL;
    if (!url || url === "") {
      return [{ source: "/api/:path*", destination: "http://localhost:8080/api/:path*" }];
    }
    return [];
  },
};

export default nextConfig;
