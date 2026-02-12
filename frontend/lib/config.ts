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