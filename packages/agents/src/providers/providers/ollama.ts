import type { LanguageModelV1 } from "@ai-sdk/provider";
import { logger } from "@chara-codes/logger";
import { createOllama } from "ollama-ai-provider";
import { ModelFetcher } from "../model-fetcher";
import type { ModelInfo } from "../types";
import { AbstractProvider, getEnvVar, validateUrl } from "./base-provider";

/**
 * Ollama provider implementation
 */
export class OllamaProvider extends AbstractProvider {
  readonly key = "ollama";
  readonly name = "Ollama";
  readonly requiresApiKey = false;
  override readonly baseUrlEnvVar = "OLLAMA_API_BASE_URL";
  override readonly defaultBaseUrl = "http://localhost:11434";

  /**
   * Check if Ollama can be initialized
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
   * Create Ollama provider factory
   */
  public async createProvider(): Promise<(modelId: string) => LanguageModelV1> {
    const baseUrl =
      (await getEnvVar(this.baseUrlEnvVar!)) || this.defaultBaseUrl;

    if (!baseUrl) {
      throw new Error(`${this.name} base URL is required but not provided`);
    }

    const ollamaProvider = createOllama({
      baseURL: baseUrl,
    });

    return (modelId: string) => ollamaProvider(modelId);
  }

  /**
   * Fetch available Ollama models
   */
  public async fetchModels(): Promise<ModelInfo[]> {
    const baseUrl =
      (await getEnvVar(this.baseUrlEnvVar!)) || this.defaultBaseUrl;
    return ModelFetcher.fetchOllamaModels(baseUrl);
  }

  /**
   * Health check for Ollama
   */
  public override async healthCheck(): Promise<boolean> {
    try {
      const models = await this.fetchModels();
      return models.length > 0;
    } catch (error) {
      logger.debug(`Ollama health check failed: ${error}`);
      return false;
    }
  }
}

// Export singleton instance
export const ollamaProvider = new OllamaProvider();
