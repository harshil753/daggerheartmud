import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Disable Fast Refresh for testing production-like behavior
  reactStrictMode: false,
};

export default nextConfig;
