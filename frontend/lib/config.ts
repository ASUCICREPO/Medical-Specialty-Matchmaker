/**
 * Application configuration
 * Centralizes environment variable access for better maintainability
 */

export const config = {
  api: {
    // For client-side: Use NEXT_PUBLIC_ prefixed variables (URLs only, no secrets)
    // For server-side: Use non-prefixed variables (can include API keys)
    chatbotUrl: process.env.NEXT_PUBLIC_API_URL || '',
    dataUrl: process.env.NEXT_PUBLIC_DATA_URL || '',
    // API Key should ONLY be accessed server-side, never exposed to browser
    // Note: Cannot use AWS_ prefix in Amplify, so using API_KEY instead
    apiKey: process.env.API_KEY || '',
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
    missing.push('API_KEY');
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }
}
