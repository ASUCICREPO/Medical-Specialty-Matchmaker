/**
 * Application configuration
 * Centralizes environment variable access for better maintainability
 */

import { runtimeConfig } from './runtime-config';

export const config = {
  api: {
    chatbotUrl: runtimeConfig.apiUrl,
    dataUrl: runtimeConfig.dataUrl,
    apiKey: runtimeConfig.apiKey,
  },
} as const;

/**
 * Validates that all required environment variables are set
 * @throws Error if any required variables are missing
 */
export function validateConfig() {
  const missing: string[] = [];

  if (!config.api.chatbotUrl) {
    missing.push('NEXT_PUBLIC_API_URL');
  }
  if (!config.api.dataUrl) {
    missing.push('NEXT_PUBLIC_DATA_URL');
  }
  if (!config.api.apiKey) {
    missing.push('NEXT_PUBLIC_API_KEY or API_KEY');
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }
}
