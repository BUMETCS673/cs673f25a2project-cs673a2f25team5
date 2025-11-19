import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.clerk.com" },
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
};

export default nextConfig;
