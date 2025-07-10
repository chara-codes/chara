import type { LanguageModelV1 } from "@ai-sdk/provider";
import { createOpenAI } from "@ai-sdk/openai";
import { logger } from "@chara-codes/logger";
import type { ModelInfo } from "../types";
import { AbstractProvider, getEnvVar, validateApiKey } from "../providers/base-provider";

/**
 * Example custom provider implementation
 * This demonstrates how to create a custom provider that extends AbstractProvider
 */
export class CustomProvider extends AbstractProvider {
  readonly key = "custom";
  readonly name = "Custom Provider";
  readonly requiresApiKey = true;
  readonly apiKeyEnvVar = "CUSTOM_API_KEY";
  readonly baseUrlEnvVar = "CUSTOM_BASE_URL";
  readonly defaultBaseUrl = "https://api.custom-provider.com";

  /**
   * Check if Custom provider can be initialized
   */
  public async canInitialize(): Promise<boolean> {
    const apiKey = await getEnvVar(this.apiKeyEnvVar!);

    if (!validateApiKey(apiKey, this.name)) {
      logger.debug(
        `${this.name} API key not found or empty - skipping initialization`
      );
      return false;
    }

    // Additional custom validation logic can go here
    const baseUrl = await getEnvVar(this.baseUrlEnvVar!) || this.defaultBaseUrl;

    // Custom validation: check if base URL is reachable (simplified example)
    try {
      new URL(baseUrl);
    } catch {
      logger.debug(`${this.name} has invalid base URL: ${baseUrl}`);
      return false;
    }

    return true;
  }

  /**
   * Create Custom provider factory
   */
  public async createProvider(): Promise<(modelId: string) => LanguageModelV1> {
    const apiKey = await getEnvVar(this.apiKeyEnvVar!);
    const baseUrl = await getEnvVar(this.baseUrlEnvVar!) || this.defaultBaseUrl;

    if (!apiKey) {
      throw new Error(`${this.name} API key is required but not provided`);
    }

    if (!baseUrl) {
      throw new Error(`${this.name} base URL is required but not provided`);
    }

    // For this example, we'll use OpenAI-compatible API
    // In practice, you'd use your custom provider's SDK
    const customProvider = createOpenAI({
      apiKey: apiKey,
      baseURL: baseUrl,
    });

    return (modelId: string) => customProvider(modelId);
  }

  /**
   * Fetch available models from Custom provider
   */
  public async fetchModels(): Promise<ModelInfo[]> {
    const apiKey = await getEnvVar(this.apiKeyEnvVar!);
    const baseUrl = await getEnvVar(this.baseUrlEnvVar!) || this.defaultBaseUrl;

    if (!apiKey || !baseUrl) {
      throw new Error(`${this.name} configuration is incomplete`);
    }

    try {
      // Example API call to fetch models
      const response = await fetch(`${baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Transform response to ModelInfo format
      return data.models?.map((model: any) => ({
        id: model.id,
        name: model.name || model.id,
        description: model.description,
        contextLength: model.context_length,
        created: model.created,
        ownedBy: model.owned_by,
      })) || [];
    } catch (error) {
      logger.error(`Failed to fetch models from ${this.name}:`, error);
      // Return empty array as fallback
      return [];
    }
  }

  /**
   * Custom health check implementation
   */
  public async healthCheck(): Promise<boolean> {
    try {
      const apiKey = await getEnvVar(this.apiKeyEnvVar!);
      const baseUrl = await getEnvVar(this.baseUrlEnvVar!) || this.defaultBaseUrl;

      if (!apiKey || !baseUrl) {
        return false;
      }

      // Simple health check - try to fetch models
      const models = await this.fetchModels();
      return models.length > 0;
    } catch (error) {
      logger.debug(`${this.name} health check failed:`, error);
      return false;
    }
  }

  /**
   * Custom configuration validation
   */
  public validateConfig?(config: Record<string, any>): boolean {
    // Custom validation logic
    if (config.apiKey && config.apiKey.length < 10) {
      logger.error(`${this.name} API key seems too short`);
      return false;
    }

    if (config.baseUrl && !config.baseUrl.startsWith('https://')) {
      logger.warning(`${this.name} base URL should use HTTPS`);
    }

    return true;
  }
}

// Export singleton instance
export const customProvider = new CustomProvider();

/**
 * Example usage:
 *
 * ```typescript
 * import { providersRegistry } from '../providers';
 * import { customProvider } from './custom-provider';
 *
 * // Register the custom provider
 * providersRegistry.registerProvider('custom', customProvider);
 *
 * // Initialize providers
 * await providersRegistry.initialize();
 *
 * // Use the custom provider
 * if (await providersRegistry.hasProvider('custom')) {
 *   const model = await providersRegistry.getModel('custom', 'gpt-4');
 *   // Use the model...
 * }
 * ```
 */
