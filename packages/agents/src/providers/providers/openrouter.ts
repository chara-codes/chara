import type { LanguageModelV1 } from "@ai-sdk/provider";
import { logger } from "@chara-codes/logger";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { ModelFetcher } from "../model-fetcher";
import type { ModelInfo } from "../types";
import { AbstractProvider, getEnvVar, validateApiKey } from "./base-provider";

/**
 * OpenRouter provider implementation
 */
export class OpenRouterProvider extends AbstractProvider {
  readonly key = "openrouter";
  readonly name = "OpenRouter";
  readonly requiresApiKey = true;
  override readonly apiKeyEnvVar = "OPEN_ROUTER_API_KEY";

  /**
   * Check if OpenRouter can be initialized
   */
  public async canInitialize(): Promise<boolean> {
    const apiKey = await getEnvVar(this.apiKeyEnvVar!);

    if (!validateApiKey(apiKey, this.name)) {
      logger.debug(
        `${this.name} API key not found or empty - skipping initialization`
      );
      return false;
    }

    return true;
  }

  /**
   * Create OpenRouter provider factory
   */
  public async createProvider(): Promise<(modelId: string) => LanguageModelV1> {
    const apiKey = await getEnvVar(this.apiKeyEnvVar!);

    if (!apiKey) {
      throw new Error(`${this.name} API key is required but not provided`);
    }

    const openRouterProvider = createOpenRouter({
      apiKey: apiKey,
    });

    return (modelId: string) => openRouterProvider(modelId);
  }

  /**
   * Fetch available OpenRouter models
   */
  public async fetchModels(): Promise<ModelInfo[]> {
    return ModelFetcher.fetchOpenRouterModels();
  }

  /**
   * Health check for OpenRouter
   */
  public override async healthCheck(): Promise<boolean> {
    try {
      const models = await this.fetchModels();
      return models.length > 0;
    } catch (error) {
      logger.debug(`OpenRouter health check failed: ${error}`);
      return false;
    }
  }
}

// Export singleton instance
export const openrouterProvider = new OpenRouterProvider();
