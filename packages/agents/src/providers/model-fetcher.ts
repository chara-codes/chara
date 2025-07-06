import { logger } from "@chara/logger";
import type {
  ModelInfo,
  OpenAIModelsResponse,
  OpenAIModel,
  OpenRouterModelsResponse,
  OpenRouterModel,
  OllamaModelsResponse,
  OllamaModel,
  AnthropicModelsResponse,
  AnthropicModel,
  GoogleModelsResponse,
  GoogleModel,
  DeepSeekModelsResponse,
  DeepSeekModel,
} from "./types";
import { getVarFromEnvOrGlobalConfig } from "@chara/settings";

/**
 * Utilities for fetching models from different providers
 */
export namespace ModelFetcher {
  /**
   * Wraps a fetch request with a timeout
   * @param fetchPromise - The fetch promise to wrap
   * @param timeoutMs - Timeout in milliseconds (default: 5000)
   * @returns Promise that resolves with the fetch result or rejects with timeout error
   */
  function withTimeout<T>(
    fetchPromise: Promise<T>,
    timeoutMs: number = 5000,
  ): Promise<T> {
    return Promise.race([
      fetchPromise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout")), timeoutMs),
      ),
    ]);
  }

  /**
   * Handles fetch errors consistently across all providers
   * @param error - The error that occurred
   * @param provider - Name of the provider
   * @param url - URL that was being fetched
   * @param additionalSuggestion - Additional provider-specific suggestion
   * @returns Array of fallback models
   */
  function handleFetchError(
    error: unknown,
    provider: string,
    url: string,
    additionalSuggestion?: string,
  ): ModelInfo[] {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    const isTimeout = errorMessage === "Request timeout";

    const baseSuggestion =
      "Check your network connection, VPN, or firewall settings";
    const suggestion = additionalSuggestion
      ? `${baseSuggestion}. ${additionalSuggestion}`
      : baseSuggestion;

    logger.warning(
      `Failed to fetch ${provider} models from API, using fallback models:`,
      {
        provider,
        url,
        error: errorMessage,
        ...(isTimeout && { suggestion }),
      },
    );
    return [];
  }

  /**
   * Fetches available models from OpenAI API
   * @returns Array of OpenAI models or fallback models if API fails
   */
  export async function fetchOpenAIModels(): Promise<ModelInfo[]> {
    try {
      const response = await withTimeout(
        fetch("https://api.openai.com/v1/models", {
          headers: {
            Authorization: `Bearer ${await getVarFromEnvOrGlobalConfig("OPENAI_API_KEY")}`,
            "Content-Type": "application/json",
          },
        }),
      );

      if (!response.ok) {
        throw new Error(
          `OpenAI API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = (await response.json()) as OpenAIModelsResponse;
      return data.data.map((model: OpenAIModel) => ({
        id: model.id,
        name: model.id,
        created: model.created,
        ownedBy: model.owned_by,
      }));
    } catch (error) {
      return handleFetchError(
        error,
        "OpenAI",
        "https://api.openai.com/v1/models",
      );
    }
  }

  /**
   * Fetches available models from OpenRouter API
   * @returns Array of OpenRouter models or fallback models if API fails
   */
  export async function fetchOpenRouterModels(): Promise<ModelInfo[]> {
    try {
      const response = await withTimeout(
        fetch("https://openrouter.ai/api/v1/models", {
          headers: {
            Authorization: `Bearer ${await getVarFromEnvOrGlobalConfig("OPEN_ROUTER_API_KEY")}`,
            "Content-Type": "application/json",
          },
        }),
      );

      if (!response.ok) {
        throw new Error(
          `OpenRouter API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = (await response.json()) as OpenRouterModelsResponse;
      return data.data.map((model: OpenRouterModel) => ({
        id: model.id,
        name: model.name,
        description: model.description,
        contextLength: model.context_length,
        created: model.created,
      }));
    } catch (error) {
      return handleFetchError(
        error,
        "OpenRouter",
        "https://openrouter.ai/api/v1/models",
      );
    }
  }

  /**
   * Fetches available models from Ollama API
   * @param baseUrl - Base URL for Ollama server (default: http://localhost:11434)
   * @returns Array of Ollama models or fallback models if API fails
   */
  export async function fetchOllamaModels(
    baseUrl = "http://localhost:11434",
  ): Promise<ModelInfo[]> {
    try {
      const response = await withTimeout(
        fetch(`${baseUrl}/api/tags`, {
          headers: {
            "Content-Type": "application/json",
          },
        }),
      );

      if (!response.ok) {
        throw new Error(
          `Ollama API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = (await response.json()) as OllamaModelsResponse;
      return data.models.map((model: OllamaModel) => ({
        id: model.name,
        name: model.name,
        description: `${model.details.family} (${model.details.parameter_size})`,
      }));
    } catch (error) {
      return handleFetchError(
        error,
        "Ollama",
        `${baseUrl}/api/tags`,
        "Ensure Ollama server is running",
      );
    }
  }

  /**
   * Fetches available models from LMStudio API
   * @param baseUrl - Base URL for LMStudio server (default: http://localhost:1234/v1)
   * @returns Array of LMStudio models or fallback models if API fails
   */
  export async function fetchLMStudioModels(
    baseUrl = "http://localhost:1234/v1",
  ): Promise<ModelInfo[]> {
    try {
      const response = await withTimeout(
        fetch(`${baseUrl}/models`, {
          headers: {
            "Content-Type": "application/json",
          },
        }),
      );

      if (!response.ok) {
        throw new Error(
          `LMStudio API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = (await response.json()) as OpenAIModelsResponse;
      return data.data
        .filter((model: OpenAIModel) => model.id.indexOf("embedding") === -1)
        .map((model: OpenAIModel) => ({
          id: model.id,
          name: model.id,
          created: model.created,
          ownedBy: model.owned_by,
        }));
    } catch (error) {
      return handleFetchError(
        error,
        "LMStudio",
        `${baseUrl}/models`,
        "Ensure LMStudio server is running",
      );
    }
  }

  /**
   * Fetches available models from DIAL API
   * @param baseUrl - Base URL for DIAL server
   * @returns Array of DIAL models or fallback models if API fails
   */
  export async function fetchDIALModels(baseUrl: string): Promise<ModelInfo[]> {
    const rootDomain = new URL(baseUrl).origin;
    try {
      const response = await withTimeout(
        fetch(`${rootDomain}/openai/models`, {
          headers: {
            "Api-Key": `${await getVarFromEnvOrGlobalConfig("DIAL_API_KEY")}`,
            "Content-Type": "application/json",
          },
        }),
      );

      if (!response.ok) {
        throw new Error(
          `DIAL API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = (await response.json()) as OpenAIModelsResponse;
      return data.data.map((model: OpenAIModel) => ({
        id: model.id,
        name: model.id,
        created: model.created,
        ownedBy: model.owned_by,
      }));
    } catch (error) {
      return handleFetchError(error, "DIAL", `${rootDomain}/openai/models`);
    }
  }

  /**
   * Fetches available models from Anthropic API
   * @returns Array of Anthropic models or fallback models if API fails
   */
  export async function fetchAnthropicModels(): Promise<ModelInfo[]> {
    try {
      const response = await withTimeout(
        fetch("https://api.anthropic.com/v1/models", {
          headers: {
            "x-api-key": `${await getVarFromEnvOrGlobalConfig("ANTHROPIC_API_KEY")}`,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01",
          },
        }),
      );

      if (!response.ok) {
        throw new Error(
          `Anthropic API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = (await response.json()) as AnthropicModelsResponse;
      return data.data.map((model: AnthropicModel) => ({
        id: model.id,
        name: model.display_name,
        created: new Date(model.created_at).getTime() / 1000,
      }));
    } catch (error) {
      return handleFetchError(
        error,
        "Anthropic",
        "https://api.anthropic.com/v1/models",
      );
    }
  }

  /**
   * Fetches available models from DeepSeek API
   * @returns Array of DeepSeek models or fallback models if API fails
   */
  export async function fetchDeepSeekModels(): Promise<ModelInfo[]> {
    try {
      const response = await withTimeout(
        fetch("https://api.deepseek.com/v1/models", {
          headers: {
            Authorization: `Bearer ${await getVarFromEnvOrGlobalConfig("DEEPSEEK_API_KEY")}`,
            "Content-Type": "application/json",
          },
        }),
      );

      if (!response.ok) {
        throw new Error(
          `DeepSeek API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = (await response.json()) as DeepSeekModelsResponse;
      return data.data.map((model: DeepSeekModel) => ({
        id: model.id,
        name: model.id,
        created: model.created,
        ownedBy: model.owned_by,
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const isTimeout = errorMessage === "Request timeout";

      return handleFetchError(
        error,
        "DeepSeek",
        "https://api.deepseek.com/v1/models",
      );
    }
  }

  /**
   * Fetches available models from Google Generative AI API
   * @returns Array of Google models or fallback models if API fails
   */
  export async function fetchGoogleModels(): Promise<ModelInfo[]> {
    try {
      const response = await withTimeout(
        fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${await getVarFromEnvOrGlobalConfig("GOOGLE_GENERATIVE_AI_API_KEY")}`,
          {
            headers: {
              "Content-Type": "application/json",
            },
            method: "GET",
          },
        ),
      );

      if (!response.ok) {
        throw new Error(
          `Google API error: ${response.status} ${response.statusText}`,
        );
      }

      const data = (await response.json()) as GoogleModelsResponse;
      return data.models
        .filter((model: GoogleModel) =>
          model.supportedGenerationMethods?.includes("generateContent"),
        )
        .map((model: GoogleModel) => ({
          id: model.name,
          name: model.displayName,
          description: model.description,
          contextLength: model.inputTokenLimit,
        }));
    } catch (error) {
      return handleFetchError(
        error,
        "Google",
        `https://generativelanguage.googleapis.com/v1beta/models?key=${await getVarFromEnvOrGlobalConfig("GOOGLE_GENERATIVE_AI_API_KEY")}`,
      );
    }
  }

  /**
   * Fetches models for a provider that supports model fetching
   * @param providerName - Name of the provider
   * @param fetchFunction - The provider's fetch function
   * @returns Array of models
   */
  export async function fetchModelsForProvider(
    providerName: string,
    fetchFunction: () => Promise<ModelInfo[]>,
  ): Promise<ModelInfo[]> {
    try {
      return await fetchFunction();
    } catch (error) {
      logger.error(`Failed to fetch models for ${providerName}:`, {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw new Error(
        `Failed to fetch models for ${providerName}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }
}
