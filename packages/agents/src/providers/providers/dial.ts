import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModelV1 } from "@ai-sdk/provider";
import { logger } from "@chara-codes/logger";
import { ModelFetcher } from "../model-fetcher";
import type { ModelInfo } from "../types";
import {
  AbstractProvider,
  getEnvVar,
  validateApiKey,
  validateUrl,
} from "./base-provider";

/**
 * DIAL provider implementation
 */
export class DIALProvider extends AbstractProvider {
  readonly key = "dial";
  readonly name = "DIAL";
  readonly requiresApiKey = true;
  override readonly apiKeyEnvVar = "DIAL_API_KEY";
  override readonly baseUrlEnvVar = "DIAL_API_BASE_URL";

  /**
   * Check if DIAL can be initialized
   */
  public async canInitialize(): Promise<boolean> {
    const apiKey = await getEnvVar(this.apiKeyEnvVar!);
    const baseUrl = await getEnvVar(this.baseUrlEnvVar!);

    if (!validateApiKey(apiKey, this.name)) {
      logger.debug(
        `${this.name} API key not found or empty - skipping initialization`
      );
      return false;
    }

    if (!validateUrl(baseUrl)) {
      logger.debug(`${this.name} base URL is invalid: ${baseUrl}`);
      return false;
    }

    return true;
  }

  /**
   * Create DIAL provider factory
   */
  public async createProvider(): Promise<(modelId: string) => LanguageModelV1> {
    const apiKey = await getEnvVar(this.apiKeyEnvVar!);
    const baseUrl = await getEnvVar(this.baseUrlEnvVar!);

    if (!apiKey) {
      throw new Error(`${this.name} API key is required but not provided`);
    }

    if (!baseUrl) {
      throw new Error(`${this.name} base URL is required but not provided`);
    }

    return (modelId: string) => {
      // DIAL expects model in URL path: baseURL/openai/deployments/{modelId}/chat/completions
      const dialModelURL = `${baseUrl}/${modelId}`;

      const dialProvider = createOpenAICompatible({
        name: "dial",
        baseURL: dialModelURL,
        headers: {
          "Api-Key": apiKey as string,
        },
      });
      return dialProvider(modelId);
    };
  }

  /**
   * Fetch available DIAL models
   */
  public async fetchModels(): Promise<ModelInfo[]> {
    const baseUrl = await getEnvVar(this.baseUrlEnvVar!);
    return ModelFetcher.fetchDIALModels(baseUrl!);
  }

  /**
   * Health check for DIAL
   */
  public override async healthCheck(): Promise<boolean> {
    try {
      const models = await this.fetchModels();
      return models.length > 0;
    } catch (error) {
      logger.debug(`DIAL health check failed: ${error}`);
      return false;
    }
  }
}

// Export singleton instance
export const dialProvider = new DIALProvider();
