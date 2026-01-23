/**
 * Application configuration
 * Centralizes environment variable access for better maintainability
 */

export const config = {
  api: {
    chatbotUrl: process.env.AWS_API_URL || process.env.NEXT_PUBLIC_API_URL || '',
    dataUrl: process.env.AWS_DATA_URL || process.env.NEXT_PUBLIC_DATA_URL || '',
  },
} as const;

/**
 * Validates that all required environment variables are set
 * @throws Error if any required variables are missing
 */
export function validateConfig() {
  const missing: string[] = [];

  if (!config.api.chatbotUrl) {
    missing.push('AWS_API_URL or NEXT_PUBLIC_API_URL');
  }
  if (!config.api.dataUrl) {
    missing.push('AWS_DATA_URL or NEXT_PUBLIC_DATA_URL');
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }
}
