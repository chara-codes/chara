import { createDeepSeek } from "@ai-sdk/deepseek";
import type { LanguageModelV1 } from "@ai-sdk/provider";
import { logger } from "@chara-codes/logger";
import { ModelFetcher } from "../model-fetcher";
import type { ModelInfo } from "../types";
import { AbstractProvider, getEnvVar, validateApiKey } from "./base-provider";

/**
 * DeepSeek provider implementation
 */
export class DeepSeekProvider extends AbstractProvider {
  readonly key = "deepseek";
  readonly name = "DeepSeek";
  readonly requiresApiKey = true;
  override readonly apiKeyEnvVar = "DEEPSEEK_API_KEY";

  /**
   * Check if DeepSeek can be initialized
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
   * Create DeepSeek provider factory
   */
  public async createProvider(): Promise<(modelId: string) => LanguageModelV1> {
    const apiKey = await getEnvVar(this.apiKeyEnvVar!);

    if (!apiKey) {
      throw new Error(`${this.name} API key is required but not provided`);
    }

    const deepseek = createDeepSeek({
      apiKey: apiKey,
    });

    return (modelId: string) => deepseek(modelId);
  }

  /**
   * Fetch available DeepSeek models
   */
  public async fetchModels(): Promise<ModelInfo[]> {
    return ModelFetcher.fetchDeepSeekModels();
  }

  /**
   * Health check for DeepSeek
   */
  public override async healthCheck(): Promise<boolean> {
    try {
      const models = await this.fetchModels();
      return models.length > 0;
    } catch (error) {
      logger.debug(`DeepSeek health check failed: ${error}`);
      return false;
    }
  }
}

// Export singleton instance
export const deepseekProvider = new DeepSeekProvider();
