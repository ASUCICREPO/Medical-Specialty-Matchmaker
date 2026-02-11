/**
 * Application configuration
 * Centralizes environment variable access for better maintainability
 */

export const config = {
  api: {
    chatbotUrl: process.env.CHAT_URL,
    dataUrl: process.env.DATA_URL,
  },
} as const;

/**
 * Validates that all required environment variables are set
 * @throws Error if any required variables are missing
 */
export function validateConfig() {
  const missing: string[] = [];

  if (!config.api.chatbotUrl) {
    missing.push('CHAT_URL');
  }
  if (!config.api.dataUrl) {
    missing.push('DATA_URL');
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }
}
