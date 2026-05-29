import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow <img> from your backend's media host without the next/image loader.
  images: { unoptimized: true },
};

export default nextConfig;
