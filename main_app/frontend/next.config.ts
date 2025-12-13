import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 💥 DANGER ZONE: ONLY USE THIS IN DEVELOPMENT
    // This explicitly allows Next.js to fetch from local IP addresses.
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
    ],
  },
};

export default nextConfig;