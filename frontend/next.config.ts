import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    CHAT_URL: process.env.CHAT_URL,
    DATA_URL: process.env.DATA_URL,
  },
};

export default nextConfig;
