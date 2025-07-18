import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModelV1 } from "@ai-sdk/provider";
import { logger } from "@chara-codes/logger";
import { ModelFetcher } from "../model-fetcher";
import type { ModelInfo } from "../types";
import { AbstractProvider, getEnvVar, validateApiKey } from "./base-provider";

/**
 * Google provider implementation
 */
export class GoogleProvider extends AbstractProvider {
  readonly key = "google";
  readonly name = "Google";
  readonly requiresApiKey = true;
  override readonly apiKeyEnvVar = "GOOGLE_GENERATIVE_AI_API_KEY";

  /**
   * Check if Google can be initialized
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
   * Create Google provider factory
   */
  public async createProvider(): Promise<(modelId: string) => LanguageModelV1> {
    const apiKey = await getEnvVar(this.apiKeyEnvVar!);

    if (!apiKey) {
      throw new Error(`${this.name} API key is required but not provided`);
    }

    const google = createGoogleGenerativeAI({
      apiKey: apiKey,
    });

    return (modelId: string) => google(modelId);
  }

  /**
   * Fetch available Google models
   */
  public async fetchModels(): Promise<ModelInfo[]> {
    return ModelFetcher.fetchGoogleModels();
  }

  /**
   * Health check for Google
   */
  public override async healthCheck(): Promise<boolean> {
    try {
      const models = await this.fetchModels();
      return models.length > 0;
    } catch (error) {
      logger.debug(`Google health check failed: ${error}`);
      return false;
    }
  }
}

// Export singleton instance
export const googleProvider = new GoogleProvider();
