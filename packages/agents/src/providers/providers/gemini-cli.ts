import type { LanguageModelV2 } from "@ai-sdk/provider";
import { createGeminiProvider } from "ai-sdk-provider-gemini-cli";
import { logger } from "../../utils/logger";
import { ModelFetcher } from "../model-fetcher";
import type { ModelInfo } from "../types";
import { AbstractProvider, getEnvVar, validateApiKey } from "./base-provider";

/**
 * Gemini CLI provider implementation
 */
export class GeminiCLIProvider extends AbstractProvider {
  readonly key = "gemini-cli";
  readonly name = "Gemini-CLI";
  readonly requiresApiKey = true; // API key is preferred over OAuth
  override readonly apiKeyEnvVar = "GEMINI_API_KEY";

  /**
   * Check if Gemini CLI can be initialized
   */
  public async canInitialize(): Promise<boolean> {
    // Try API key first (preferred method)
    const apiKey = await getEnvVar(this.apiKeyEnvVar ?? "GEMINI_API_KEY");
    if (validateApiKey(apiKey, this.name)) {
      logger.debug("Using API key authentication for Gemini CLI");
      return true;
    }

    // Fallback to OAuth authentication
    try {
      createGeminiProvider({
        authType: "oauth-personal",
      });
      // If OAuth works, we're good
      logger.debug("Using OAuth authentication for Gemini CLI");
      return true;
    } catch (oauthError) {
      logger.debug(`Gemini CLI OAuth authentication failed: ${oauthError}`);

      logger.debug(
        `${this.name} cannot be initialized - no API key or OAuth credentials found`
      );
      return false;
    }
  }

  /**
   * Create Gemini CLI provider factory
   */
  public async createProvider(): Promise<(modelId: string) => LanguageModelV2> {
    // Try API key first
    const apiKey = await getEnvVar(this.apiKeyEnvVar ?? "GEMINI_API_KEY");
    if (apiKey && validateApiKey(apiKey, this.name)) {
      const gemini = createGeminiProvider({
        authType: "api-key",
        apiKey: apiKey,
      });

      return (modelId: string) => gemini(modelId);
    }

    // Fallback to OAuth
    try {
      const gemini = createGeminiProvider({
        authType: "oauth-personal",
      });

      return (modelId: string) => gemini(modelId);
    } catch (oauthError) {
      logger.debug(`OAuth failed: ${oauthError}`);

      throw new Error(
        `${this.name} requires either API key (GEMINI_API_KEY) or OAuth authentication (run 'gemini' CLI first)`
      );
    }
  }

  /**
   * Fetch available Gemini CLI models
   */
  public async fetchModels(): Promise<ModelInfo[]> {
    return ModelFetcher.fetchGeminiCLIModels();
  }

  /**
   * Health check for Gemini CLI
   */
  public override async healthCheck(): Promise<boolean> {
    try {
      const models = await this.fetchModels();
      return models.length > 0;
    } catch (error) {
      logger.debug(`Gemini CLI health check failed: ${error}`);
      return false;
    }
  }
}

// Export singleton instance
export const geminiCLIProvider = new GeminiCLIProvider();
