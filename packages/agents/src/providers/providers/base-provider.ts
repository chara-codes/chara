import type { LanguageModelV1 } from "@ai-sdk/provider";
import type { ModelInfo } from "../types";

/**
 * Base interface that all providers must implement
 */
export interface BaseProvider {
  /** The unique key for this provider */
  key: string;
  /** Human-readable name of the provider */
  name: string;
  /** Whether this provider requires an API key */
  requiresApiKey: boolean;
  /** Environment variable name for the API key (if required) */
  apiKeyEnvVar?: string;
  /** Environment variable name for the base URL (if applicable) */
  baseUrlEnvVar?: string;
  /** Default base URL (if applicable) */
  defaultBaseUrl?: string;

  /**
   * Check if the provider can be initialized with current configuration
   * @returns true if the provider can be initialized
   */
  canInitialize(): Promise<boolean>;

  /**
   * Create the provider factory function
   * @returns Function that creates LanguageModelV1 instances
   */
  createProvider(): Promise<(modelId: string) => LanguageModelV1>;

  /**
   * Fetch available models from this provider
   * @returns Array of available models
   */
  fetchModels(): Promise<ModelInfo[]>;

  /**
   * Validate additional configuration if needed
   * @param config Configuration object
   * @returns true if configuration is valid
   */
  validateConfig?(config: Record<string, any>): boolean;

  /**
   * Health check for the provider
   * @returns true if the provider is healthy
   */
  healthCheck?(): Promise<boolean>;
}

/**
 * Abstract base class that provides common functionality for all providers
 */
export abstract class AbstractProvider implements BaseProvider {
  abstract key: string;
  abstract name: string;
  abstract requiresApiKey: boolean;
  apiKeyEnvVar?: string;
  baseUrlEnvVar?: string;
  defaultBaseUrl?: string;

  abstract canInitialize(): Promise<boolean>;
  abstract createProvider(): Promise<(modelId: string) => LanguageModelV1>;
  abstract fetchModels(): Promise<ModelInfo[]>;

  /**
   * Default health check implementation
   * Attempts to fetch models as a health check
   */
  public async healthCheck(): Promise<boolean> {
    try {
      await this.fetchModels();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Default config validation (no validation)
   */
  public validateConfig?(config: Record<string, any>): boolean {
    return true;
  }
}

/**
 * Helper function to get environment variables with fallback to global config
 */
export async function getEnvVar(varName: string): Promise<string | undefined> {
  // Import here to avoid circular dependencies
  const { getVarFromEnvOrGlobalConfig } = await import("@chara-codes/settings");
  return getVarFromEnvOrGlobalConfig(varName);
}

/**
 * Helper function to validate API keys
 */
export function validateApiKey(
  apiKey: string | undefined,
  providerName: string
): boolean {
  if (!apiKey || apiKey.trim() === "") {
    return false;
  }
  return true;
}

/**
 * Helper function to validate URLs
 */
export function validateUrl(url: string | undefined): boolean {
  if (!url) return false;

  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
