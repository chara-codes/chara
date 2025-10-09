import dotenv from 'dotenv';

// Load environment variables from .env file if it exists
dotenv.config();

/**
 * Environment configuration for the server
 */
export const env = {
  /**
   * Base URL for the agents service
   * @default 'http://localhost:3031'
   */
  AGENTS_BASE_URL: process.env.AGENTS_BASE_URL || 'http://localhost:3031',

  /**
   * Server port
   * @default 3030
   */
  SERVER_PORT: parseInt(process.env.SERVER_PORT || '3030'),

  /**
   * Environment mode
   * @default 'development'
   */
  NODE_ENV: process.env.NODE_ENV || 'development',

  /**
   * Enable debug logging
   * @default false
   */
  DEBUG: process.env.DEBUG === 'true',
} as const;

/**
 * Validate that all required environment variables are set
 */
export function validateEnv(): void {
  const errors: string[] = [];

  // Add validation for required environment variables here
  // For now, AGENTS_BASE_URL has a default, so no validation needed

  if (errors.length > 0) {
    console.error('Environment validation failed:');
    errors.forEach(error => {
      console.error(`- ${error}`);
    });
    process.exit(1);
  }
}

/**
 * Get the agents API URL with the given path
 */
export function getAgentsApiUrl(path: string): string {
  const baseUrl = env.AGENTS_BASE_URL.replace(/\/$/, ''); // Remove trailing slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}
