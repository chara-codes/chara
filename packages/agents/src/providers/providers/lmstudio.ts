import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModelV1 } from "@ai-sdk/provider";
import { logger } from "@chara-codes/logger";
import { ModelFetcher } from "../model-fetcher";
import type { ModelInfo } from "../types";
import { AbstractProvider, getEnvVar, validateUrl } from "./base-provider";

/**
 * LMStudio provider implementation
 */
export class LMStudioProvider extends AbstractProvider {
  readonly key = "lmstudio";
  readonly name = "LMStudio";
  readonly requiresApiKey = false;
  override readonly baseUrlEnvVar = "LMSTUDIO_API_BASE_URL";
  override readonly defaultBaseUrl = "http://localhost:1234/v1";

  /**
   * Check if LMStudio can be initialized
   */
  public async canInitialize(): Promise<boolean> {
    const baseUrl =
      (await getEnvVar(this.baseUrlEnvVar!)) || this.defaultBaseUrl;

    if (!validateUrl(baseUrl)) {
      logger.debug(`${this.name} base URL is invalid: ${baseUrl}`);
      return false;
    }

    return true;
  }

  /**
   * Create LMStudio provider factory
   */
  public async createProvider(): Promise<(modelId: string) => LanguageModelV1> {
    const baseUrl =
      (await getEnvVar(this.baseUrlEnvVar!)) || this.defaultBaseUrl;

    if (!baseUrl) {
      throw new Error(`${this.name} base URL is required but not provided`);
    }

    const lmstudioProvider = createOpenAICompatible({
      name: "lmstudio",
      baseURL: baseUrl,
    });

    return (modelId: string) => lmstudioProvider(modelId);
  }

  /**
   * Fetch available LMStudio models
   */
  public async fetchModels(): Promise<ModelInfo[]> {
    const baseUrl =
      (await getEnvVar(this.baseUrlEnvVar!)) || this.defaultBaseUrl;
    return ModelFetcher.fetchLMStudioModels(baseUrl);
  }

  /**
   * Health check for LMStudio
   */
  public override async healthCheck(): Promise<boolean> {
    try {
      const models = await this.fetchModels();
      return models.length > 0;
    } catch (error) {
      logger.debug(`LMStudio health check failed: ${error}`);
      return false;
    }
  }
}

// Export singleton instance
export const lmstudioProvider = new LMStudioProvider();
