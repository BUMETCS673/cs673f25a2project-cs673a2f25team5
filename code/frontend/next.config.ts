import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    domains: ["images.clerk.com", "img.clerk.com", "localhost"],
  },
};

export default nextConfig;
