import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Disable Fast Refresh for testing production-like behavior
  reactStrictMode: false,
  
  // Optimize font loading
  experimental: {
    optimizeFonts: true,
  },
  
  // Webpack configuration for better performance
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;
