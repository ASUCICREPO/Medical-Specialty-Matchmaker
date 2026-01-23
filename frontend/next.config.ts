import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    // Server-side environment variables
    AWS_API_URL: process.env.AWS_API_URL,
    AWS_DATA_URL: process.env.AWS_DATA_URL,
  },
};

export default nextConfig;
