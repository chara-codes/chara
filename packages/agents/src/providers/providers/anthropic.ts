import { createAnthropic } from "@ai-sdk/anthropic";
import type { LanguageModelV1 } from "@ai-sdk/provider";
import { logger } from "@chara-codes/logger";
import { ModelFetcher } from "../model-fetcher";
import type { ModelInfo } from "../types";
import { AbstractProvider, getEnvVar, validateApiKey } from "./base-provider";

/**
 * Anthropic provider implementation
 */
export class AnthropicProvider extends AbstractProvider {
  readonly key = "anthropic";
  readonly name = "Anthropic";
  readonly requiresApiKey = true;
  override readonly apiKeyEnvVar = "ANTHROPIC_API_KEY";

  /**
   * Check if Anthropic can be initialized
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
   * Create Anthropic provider factory
   */
  public async createProvider(): Promise<(modelId: string) => LanguageModelV1> {
    const apiKey = await getEnvVar(this.apiKeyEnvVar!);

    if (!apiKey) {
      throw new Error(`${this.name} API key is required but not provided`);
    }

    const anthropic = createAnthropic({
      apiKey: apiKey,
    });

    return (modelId: string) => anthropic(modelId);
  }

  /**
   * Fetch available Anthropic models
   */
  public async fetchModels(): Promise<ModelInfo[]> {
    return ModelFetcher.fetchAnthropicModels();
  }

  /**
   * Health check for Anthropic
   */
  public override async healthCheck(): Promise<boolean> {
    try {
      const models = await this.fetchModels();
      return models.length > 0;
    } catch (error) {
      logger.debug(`Anthropic health check failed: ${error}`);
      return false;
    }
  }
}

// Export singleton instance
export const anthropicProvider = new AnthropicProvider();
