# Configuration Module

This directory contains centralized configuration management for the application.

## `config.ts`

Centralizes all environment variable access to improve maintainability and security.

### Benefits

1. **Single Source of Truth**: All environment variables are accessed through one config object
2. **Type Safety**: TypeScript ensures proper usage of config values
3. **Server-Side Only**: Environment variables are kept server-side (not exposed to browser)
4. **Easy Validation**: Built-in validation ensures required variables are set
5. **Better Maintainability**: Changing variable names only requires updating one file

### Usage

```typescript
import { config } from '@/lib/config';

// Access API URLs
const chatbotUrl = config.api.chatbotUrl;
const dataUrl = config.api.dataUrl;
```

### Environment Variables

The following environment variables should be set in `.env`:

- `AWS_API_URL` - URL for the chatbot API endpoint
- `AWS_DATA_URL` - URL for the data API endpoint

**Note**: These variables are server-side only and will not be exposed to the browser. They are accessed through Next.js API routes.

### Backward Compatibility

The config supports both old (`NEXT_PUBLIC_*`) and new (`AWS_*`) variable names for backward compatibility during migration:

```typescript
chatbotUrl: process.env.AWS_API_URL || process.env.NEXT_PUBLIC_API_URL || ''
```

This allows existing deployments to continue working while new deployments use the more secure server-side variables.
