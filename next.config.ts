import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-4a473832e7ab46c8a1316285ebcdc582.r2.dev",
      },
    ],
  },
};

export default nextConfig;
