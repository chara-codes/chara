import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModelV1 } from "@ai-sdk/provider";
import { logger } from "@chara-codes/logger";
import { ModelFetcher } from "../model-fetcher";
import type { ModelInfo } from "../types";
import { AbstractProvider, getEnvVar, validateApiKey } from "./base-provider";

/**
 * Moonshot provider implementation
 */
export class MoonshotProvider extends AbstractProvider {
  readonly key = "moonshot";
  readonly name = "Moonshot";
  readonly requiresApiKey = true;
  override readonly apiKeyEnvVar = "MOONSHOT_API_KEY";
  override readonly defaultBaseUrl = "https://api.moonshot.ai/v1";

  /**
   * Check if Moonshot can be initialized
   */
  public async canInitialize(): Promise<boolean> {
    const apiKey = await getEnvVar(this.apiKeyEnvVar || "");

    if (!validateApiKey(apiKey, this.name)) {
      logger.debug(
        `${this.name} API key not found or empty - skipping initialization`
      );
      return false;
    }

    return true;
  }

  /**
   * Create Moonshot provider factory
   */
  public async createProvider(): Promise<(modelId: string) => LanguageModelV1> {
    const apiKey = await getEnvVar(this.apiKeyEnvVar || "");

    if (!apiKey) {
      throw new Error(`${this.name} API key is required but not provided`);
    }

    const moonshotProvider = createOpenAICompatible({
      name: "moonshot",
      baseURL: this.defaultBaseUrl,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    return (modelId: string) => moonshotProvider(modelId);
  }

  /**
   * Fetch available Moonshot models
   */
  public async fetchModels(): Promise<ModelInfo[]> {
    return ModelFetcher.fetchMoonshotModels();
  }

  /**
   * Health check for Moonshot
   */
  public override async healthCheck(): Promise<boolean> {
    try {
      const models = await this.fetchModels();
      return models.length > 0;
    } catch (error) {
      logger.debug(`Moonshot health check failed: ${error}`);
      return false;
    }
  }
}

// Export singleton instance
export const moonshotProvider = new MoonshotProvider();
