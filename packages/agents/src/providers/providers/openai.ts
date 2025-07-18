import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModelV1 } from "@ai-sdk/provider";
import { logger } from "@chara-codes/logger";
import { ModelFetcher } from "../model-fetcher";
import type { ModelInfo } from "../types";
import { AbstractProvider, getEnvVar, validateApiKey } from "./base-provider";

/**
 * OpenAI provider implementation
 */
export class OpenAIProvider extends AbstractProvider {
  readonly key = "openai";
  readonly name = "OpenAI";
  readonly requiresApiKey = true;
  override readonly apiKeyEnvVar = "OPENAI_API_KEY";

  /**
   * Check if OpenAI can be initialized
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
   * Create OpenAI provider factory
   */
  public async createProvider(): Promise<(modelId: string) => LanguageModelV1> {
    const apiKey = await getEnvVar(this.apiKeyEnvVar!);

    if (!apiKey) {
      throw new Error(`${this.name} API key is required but not provided`);
    }

    const openai = createOpenAI({
      apiKey: apiKey,
    });

    return (modelId: string) => openai(modelId);
  }

  /**
   * Fetch available OpenAI models
   */
  public async fetchModels(): Promise<ModelInfo[]> {
    return ModelFetcher.fetchOpenAIModels();
  }

  /**
   * Health check for OpenAI
   */
  public override async healthCheck(): Promise<boolean> {
    try {
      const models = await this.fetchModels();
      return models.length > 0;
    } catch (error) {
      logger.debug(`OpenAI health check failed: ${error}`);
      return false;
    }
  }
}

// Export singleton instance
export const openaiProvider = new OpenAIProvider();
