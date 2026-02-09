import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Environment variables are handled automatically:
  // - NEXT_PUBLIC_* variables are available on both client and server
  // - Other variables are only available on the server (API routes)
};

export default nextConfig;
