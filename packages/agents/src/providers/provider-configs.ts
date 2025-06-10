import { openai, createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createAzure } from "@ai-sdk/azure";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { mistral } from "@ai-sdk/mistral";
import { createGroq } from "@ai-sdk/groq";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createOllama } from "ollama-ai-provider";
import { bedrock } from "@ai-sdk/amazon-bedrock";
import { logger } from "@chara/logger";
import type { ProviderConfig } from "./types";
import { ModelFetcher } from "./model-fetcher";
import { BaseProviderInitializer } from "./base-initializer";

/**
 * Individual provider configuration functions
 */
export class ProviderConfigs extends BaseProviderInitializer {
  /**
   * Initialize OpenAI provider
   */
  public initializeOpenAI(): ProviderConfig | null {
    if (!this.validateApiKey(process.env.OPENAI_API_KEY, "OpenAI")) {
      return null;
    }

    return this.safeInitialize("OpenAI", () => ({
      name: "OpenAI",
      provider: (modelId: string) => openai(modelId),
      isAvailable: true,
      fetchModels: ModelFetcher.fetchOpenAIModels,
    }));
  }

  /**
   * Initialize Anthropic provider
   */
  public initializeAnthropic(): ProviderConfig | null {
    if (!this.validateApiKey(process.env.ANTHROPIC_API_KEY, "Anthropic")) {
      return null;
    }

    return this.safeInitialize("Anthropic", () => ({
      name: "Anthropic",
      provider: (modelId: string) => anthropic(modelId),
      isAvailable: true,
      fetchModels: ModelFetcher.fetchAnthropicModels,
    }));
  }

  /**
   * Initialize Google provider
   */
  public initializeGoogle(): ProviderConfig | null {
    if (
      !this.validateApiKey(process.env.GOOGLE_GENERATIVE_AI_API_KEY, "Google")
    ) {
      return null;
    }

    return this.safeInitialize("Google", () => ({
      name: "Google",
      provider: (modelId: string) => google(modelId),
      isAvailable: true,
    }));
  }

  /**
   * Initialize Mistral provider
   */
  public initializeMistral(): ProviderConfig | null {
    if (!this.validateApiKey(process.env.MISTRAL_API_KEY, "Mistral")) {
      return null;
    }

    return this.safeInitialize("Mistral", () => ({
      name: "Mistral",
      provider: (modelId: string) => mistral(modelId),
      isAvailable: true,
    }));
  }

  /**
   * Initialize Groq provider
   */
  public initializeGroq(): ProviderConfig | null {
    if (!this.validateApiKey(process.env.GROQ_API_KEY, "Groq")) {
      return null;
    }

    return this.safeInitialize("Groq", () => {
      const groqProvider = createGroq({
        apiKey: process.env.GROQ_API_KEY as string,
      });
      return {
        name: "Groq",
        provider: (modelId: string) => groqProvider(modelId),
        isAvailable: true,
      };
    });
  }

  /**
   * Initialize OpenRouter provider
   */
  public initializeOpenRouter(): ProviderConfig | null {
    if (!this.validateApiKey(process.env.OPEN_ROUTER_API_KEY, "OpenRouter")) {
      return null;
    }

    return this.safeInitialize("OpenRouter", () => {
      const openRouterProvider = createOpenRouter({
        apiKey: process.env.OPEN_ROUTER_API_KEY as string,
      });
      return {
        name: "OpenRouter",
        provider: (modelId: string) => openRouterProvider(modelId),
        isAvailable: true,
        fetchModels: ModelFetcher.fetchOpenRouterModels,
      };
    });
  }

  /**
   * Initialize Ollama provider
   */
  public initializeOllama(): ProviderConfig | null {
    if (!process.env.OLLAMA_API_BASE_URL) {
      return null;
    }

    return this.safeInitialize("Ollama", () => {
      const baseURL = process.env.OLLAMA_API_BASE_URL;
      if (!baseURL) {
        throw new Error("OLLAMA_API_BASE_URL is required");
      }
      // Validate URL format
      new URL(baseURL);
      const ollamaProvider = createOllama({
        baseURL,
      });
      return {
        name: "Ollama",
        provider: (modelId: string) =>
          ollamaProvider(modelId, { simulateStreaming: true }),
        isAvailable: true,
        fetchModels: ModelFetcher.fetchOllamaModels,
      };
    });
  }

  /**
   * Initialize xAI provider
   */
  public initializeXAI(): ProviderConfig | null {
    if (!this.validateApiKey(process.env.XAI_API_KEY, "xAI")) {
      return null;
    }

    return this.safeInitialize("xAI", () => {
      const xaiProvider = createOpenAI({
        apiKey: process.env.XAI_API_KEY as string,
        baseURL: "https://api.x.ai/v1",
      });
      return {
        name: "xAI",
        provider: (modelId: string) => xaiProvider(modelId),
        isAvailable: true,
      };
    });
  }

  /**
   * Initialize LMStudio provider
   */
  public initializeLMStudio(): ProviderConfig | null {
    if (!process.env.LMSTUDIO_API_BASE_URL) {
      return null;
    }

    return this.safeInitialize("LMStudio", () => {
      const baseURL = process.env.LMSTUDIO_API_BASE_URL;
      if (!baseURL) {
        throw new Error("LMSTUDIO_API_BASE_URL is required");
      }
      // Validate URL format
      new URL(baseURL);
      const lmstudioProvider = createOpenAICompatible({
        name: "lmstudio",
        baseURL,
      });
      return {
        name: "LMStudio",
        provider: (modelId: string) => lmstudioProvider(modelId),
        isAvailable: true,
        fetchModels: () => ModelFetcher.fetchLMStudioModels(baseURL),
      };
    });
  }

  /**
   * Initialize AWS Bedrock provider
   */
  public initializeBedrock(): ProviderConfig | null {
    if (!process.env.AWS_BEDROCK_CONFIG) {
      return null;
    }

    return this.safeInitialize("AWS Bedrock", () => {
      const configStr = process.env.AWS_BEDROCK_CONFIG;
      if (!configStr) {
        throw new Error("AWS_BEDROCK_CONFIG is required");
      }
      const config = JSON.parse(configStr);
      const bedrockProvider = bedrock(config);
      return {
        name: "AWS Bedrock",
        provider: (modelId: string) => bedrockProvider,
        isAvailable: true,
      };
    });
  }

  /**
   * Initialize DIAL provider
   */
  public initializeDIAL(): ProviderConfig | null {
    if (!this.validateApiKey(process.env.DIAL_API_KEY, "DIAL")) {
      return null;
    }

    if (!process.env.DIAL_API_BASE_URL) {
      logger.warning("DIAL_API_BASE_URL is required for DIAL provider");
      return null;
    }

    return this.safeInitialize("DIAL", () => {
      const baseURL = process.env.DIAL_API_BASE_URL;
      if (!baseURL) {
        throw new Error("DIAL_API_BASE_URL is required");
      }
      // Validate URL format
      new URL(baseURL);
      const dialProvider = createAzure({
        apiKey: process.env.DIAL_API_KEY as string,
        baseURL,
      });
      return {
        name: "DIAL",
        provider: (modelId: string) => dialProvider(modelId),
        isAvailable: true,
        fetchModels: () => ModelFetcher.fetchDIALModels(baseURL),
      };
    });
  }

  /**
   * Initialize HuggingFace provider (placeholder)
   */
  public initializeHuggingFace(): ProviderConfig | null {
    if (!this.validateApiKey(process.env.HuggingFace_API_KEY, "HuggingFace")) {
      return null;
    }

    // Note: HuggingFace would need a custom provider implementation
    // This is a placeholder for future implementation
    logger.warning("HuggingFace provider detected but not yet implemented");

    return {
      name: "HuggingFace",
      provider: (_modelId: string) => {
        throw new Error("HuggingFace provider not yet implemented");
      },
      isAvailable: false, // Set to false until implemented
    };
  }

  /**
   * Get all provider initialization methods
   */
  public getAllProviderInitializers(): Record<
    string,
    () => ProviderConfig | null
  > {
    return {
      openai: () => this.initializeOpenAI(),
      anthropic: () => this.initializeAnthropic(),
      google: () => this.initializeGoogle(),
      mistral: () => this.initializeMistral(),
      groq: () => this.initializeGroq(),
      openrouter: () => this.initializeOpenRouter(),
      ollama: () => this.initializeOllama(),
      lmstudio: () => this.initializeLMStudio(),
      xai: () => this.initializeXAI(),
      bedrock: () => this.initializeBedrock(),
      dial: () => this.initializeDIAL(),
      huggingface: () => this.initializeHuggingFace(),
    };
  }
}
