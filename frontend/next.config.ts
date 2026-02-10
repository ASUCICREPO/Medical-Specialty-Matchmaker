import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // For Amplify SSR, environment variables need to be explicitly defined
  // at build time to be available in Lambda functions
  env: {
    // These will be embedded in the Lambda function at build time
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
    NEXT_PUBLIC_DATA_URL: process.env.NEXT_PUBLIC_DATA_URL || '',
    NEXT_PUBLIC_API_KEY: process.env.NEXT_PUBLIC_API_KEY || '',
  },
};

export default nextConfig;
