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
} from "./types";

/**
 * Utilities for fetching models from different providers
 */
export namespace ModelFetcher {
  /**
   * Fetches available models from OpenAI API
   * @returns Array of OpenAI models or fallback models if API fails
   */
  export async function fetchOpenAIModels(): Promise<ModelInfo[]> {
    try {
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      });

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
      logger.warning(
        "Failed to fetch OpenAI models from API, using fallback models:",
        {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      );

      // Fallback to known models if API fails
      return [
        { id: "gpt-4o", name: "GPT-4o" },
        { id: "gpt-4o-mini", name: "GPT-4o Mini" },
        { id: "gpt-4-turbo", name: "GPT-4 Turbo" },
        { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
      ];
    }
  }

  /**
   * Fetches available models from OpenRouter API
   * @returns Array of OpenRouter models or fallback models if API fails
   */
  export async function fetchOpenRouterModels(): Promise<ModelInfo[]> {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/models", {
        headers: {
          Authorization: `Bearer ${process.env.OPEN_ROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      });

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
      logger.warning(
        "Failed to fetch OpenRouter models from API, using fallback models:",
        {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      );

      // Fallback to known popular models if API fails
      return [
        { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet" },
        { id: "openai/gpt-4o", name: "GPT-4o" },
        { id: "openai/gpt-4o-mini", name: "GPT-4o Mini" },
        {
          id: "meta-llama/llama-3.1-8b-instruct",
          name: "Llama 3.1 8B Instruct",
        },
        { id: "google/gemini-pro-1.5", name: "Gemini Pro 1.5" },
      ];
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
      const response = await fetch(`${baseUrl}/api/tags`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

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
      logger.warning(
        "Failed to fetch Ollama models from API, using fallback models:",
        {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      );

      // Fallback to known popular models if API fails
      return [
        { id: "llama3.2", name: "Llama 3.2" },
        { id: "llama3.1", name: "Llama 3.1" },
        { id: "mistral", name: "Mistral" },
        { id: "codellama", name: "Code Llama" },
      ];
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
      const response = await fetch(`${baseUrl}/models`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

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
      logger.warning(
        "Failed to fetch LMStudio models from API, using fallback models:",
        {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      );

      // Fallback to known popular models if API fails
      return [
        { id: "local-model", name: "Local Model" },
        { id: "llama-3.2-3b-instruct", name: "Llama 3.2 3B Instruct" },
        { id: "llama-3.1-8b-instruct", name: "Llama 3.1 8B Instruct" },
        { id: "mistral-7b-instruct", name: "Mistral 7B Instruct" },
      ];
    }
  }

  /**
   * Fetches available models from DIAL API
   * @param baseUrl - Base URL for DIAL server
   * @returns Array of DIAL models or fallback models if API fails
   */
  export async function fetchDIALModels(baseUrl: string): Promise<ModelInfo[]> {
    try {
      const rootDomain = new URL(baseUrl).origin;
      const response = await fetch(`${rootDomain}/openai/models`, {
        headers: {
          "Api-Key": `${process.env.DIAL_API_KEY}`,
          "Content-Type": "application/json",
        },
      });

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
      logger.warning(
        "Failed to fetch DIAL models from API, using fallback models:",
        {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      );

      // Fallback to known models if API fails
      return [
        { id: "dial-model", name: "DIAL Model" },
        { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
        { id: "gpt-4", name: "GPT-4" },
      ];
    }
  }

  /**
   * Fetches available models from Anthropic API
   * @returns Array of Anthropic models or fallback models if API fails
   */
  export async function fetchAnthropicModels(): Promise<ModelInfo[]> {
    try {
      const response = await fetch("https://api.anthropic.com/v1/models", {
        headers: {
          "x-api-key": `${process.env.ANTHROPIC_API_KEY}`,
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01",
        },
      });

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
      logger.warning(
        "Failed to fetch Anthropic models from API, using fallback models:",
        {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      );

      // Fallback to known models if API fails
      return [
        { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet" },
        { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku" },
        { id: "claude-3-opus-20240229", name: "Claude 3 Opus" },
        { id: "claude-3-sonnet-20240229", name: "Claude 3 Sonnet" },
        { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku" },
      ];
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
