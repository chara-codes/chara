import { logger } from '@chara/logger';
import type { InitializationError, ProviderConfig } from './types';

/**
 * Base class for provider initialization with common utilities
 */
export abstract class BaseProviderInitializer {
  protected initializationErrors: InitializationError[] = [];

  /**
   * Validates that an API key is present and not empty
   * @param apiKey - The API key to validate
   * @param providerName - Name of the provider for logging
   * @returns true if the API key is valid, false otherwise
   */
  protected validateApiKey(
    apiKey: string | undefined,
    providerName: string,
  ): boolean {
    if (!apiKey || apiKey.trim() === "") {
      logger.warning(
        `${providerName} API key not found or empty - skipping initialization`,
      );
      return false;
    }
    return true;
  }

  /**
   * Logs the initialization status of a provider and tracks errors
   * @param provider - Name of the provider
   * @param status - Whether initialization succeeded or failed
   * @param error - Error message if initialization failed
   */
  protected logProviderStatus(
    provider: string,
    status: "success" | "failed",
    error?: string,
  ): void {
    if (status === "success") {
      logger.success(`${provider} provider initialized successfully`);
    } else {
      logger.error(`${provider} provider initialization failed: ${error}`);
      this.initializationErrors.push({
        provider,
        error: error || "Unknown error",
      });
    }
  }

  /**
   * Safe provider initialization wrapper
   * @param providerName - Name of the provider
   * @param initFn - Function that returns the provider config
   * @returns The provider config or null if initialization failed
   */
  protected safeInitialize(
    providerName: string,
    initFn: () => ProviderConfig,
  ): ProviderConfig | null {
    try {
      const config = initFn();
      this.logProviderStatus(providerName, "success");
      return config;
    } catch (error) {
      this.logProviderStatus(
        providerName,
        "failed",
        error instanceof Error ? error.message : "Unknown error",
      );
      return null;
    }
  }

  /**
   * Gets all initialization errors that occurred
   * @returns Array of initialization errors
   */
  public getInitializationErrors(): InitializationError[] {
    return [...this.initializationErrors];
  }
}