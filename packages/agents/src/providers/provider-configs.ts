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
import type { LanguageModelV1 } from "@ai-sdk/provider";

/**
 * Provider factory configuration type
 */
export interface ProviderFactoryConfig {
  name: string;
  envApiKey?: string;
  baseUrlEnvName?: string;
  createProviderFn: (
    config: Record<string, any>,
  ) => (modelId: string) => LanguageModelV1;
  fetchModelsMethod?: () => Promise<any[]>;
  additionalValidation?: (config: Record<string, any>) => boolean;
  requiresApiKey?: boolean;
}

/**
 * Individual provider configuration functions
 */
export class ProviderConfigs extends BaseProviderInitializer {
  // Registry of provider configurations
  private providerRegistry: Record<string, ProviderFactoryConfig> = {
    openai: {
      name: "OpenAI",
      envApiKey: "OPENAI_API_KEY",
      createProviderFn: () => (modelId: string) => openai(modelId),
      fetchModelsMethod: ModelFetcher.fetchOpenAIModels,
    },
    anthropic: {
      name: "Anthropic",
      envApiKey: "ANTHROPIC_API_KEY",
      createProviderFn: () => (modelId: string) => anthropic(modelId),
      fetchModelsMethod: ModelFetcher.fetchAnthropicModels,
    },
    google: {
      name: "Google",
      envApiKey: "GOOGLE_GENERATIVE_AI_API_KEY",
      createProviderFn: () => (modelId: string) => google(modelId),
      fetchModelsMethod: ModelFetcher.fetchGoogleModels,
    },
    mistral: {
      name: "Mistral",
      envApiKey: "MISTRAL_API_KEY",
      createProviderFn: () => (modelId: string) => mistral(modelId),
    },
    groq: {
      name: "Groq",
      envApiKey: "GROQ_API_KEY",
      createProviderFn: (config) => {
        const groqProvider = createGroq({
          apiKey: config.apiKey as string,
        });
        return (modelId: string) => groqProvider(modelId);
      },
    },
    openrouter: {
      name: "OpenRouter",
      envApiKey: "OPEN_ROUTER_API_KEY",
      createProviderFn: (config) => {
        const openRouterProvider = createOpenRouter({
          apiKey: config.apiKey as string,
        });
        return (modelId: string) => openRouterProvider(modelId);
      },
      fetchModelsMethod: ModelFetcher.fetchOpenRouterModels,
    },
    ollama: {
      name: "Ollama",
      baseUrlEnvName: "OLLAMA_API_BASE_URL",
      requiresApiKey: false,
      createProviderFn: (config) => {
        const ollamaProvider = createOllama({
          baseURL: config.baseURL as string,
        });
        return (modelId: string) =>
          ollamaProvider(modelId, { simulateStreaming: true });
      },
      fetchModelsMethod: ModelFetcher.fetchOllamaModels,
    },
    lmstudio: {
      name: "LMStudio",
      baseUrlEnvName: "LMSTUDIO_API_BASE_URL",
      requiresApiKey: false,
      createProviderFn: (config) => {
        const lmstudioProvider = createOpenAICompatible({
          name: "lmstudio",
          baseURL: config.baseURL as string,
        });
        return (modelId: string) => lmstudioProvider(modelId);
      },
      fetchModelsMethod: function () {
        const url = process.env.LMSTUDIO_API_BASE_URL || "";
        return ModelFetcher.fetchLMStudioModels(url);
      },
    },
    xai: {
      name: "xAI",
      envApiKey: "XAI_API_KEY",
      createProviderFn: (config) => {
        const xaiProvider = createOpenAI({
          apiKey: config.apiKey as string,
          baseURL: "https://api.x.ai/v1",
        });
        return (modelId: string) => xaiProvider(modelId);
      },
    },
    bedrock: {
      name: "AWS Bedrock",
      createProviderFn: (config) => {
        return () =>
          bedrock(JSON.parse(process.env.AWS_BEDROCK_CONFIG || "{}"));
      },
      additionalValidation: () => !!process.env.AWS_BEDROCK_CONFIG,
    },
    dial: {
      name: "DIAL",
      envApiKey: "DIAL_API_KEY",
      baseUrlEnvName: "DIAL_API_BASE_URL",
      createProviderFn: (config) => {
        return (modelId: string) => {
          // DIAL expects model in URL path: baseURL/openai/deployments/{modelId}/chat/completions
          const baseURL = config.baseURL as string;

          // Handle various base URL formats to avoid duplication
          let cleanBaseURL = baseURL;

          // Remove trailing slashes
          cleanBaseURL = cleanBaseURL.replace(/\/+$/, "");

          // Remove any existing /openai/deployments/{model}/chat/completions paths
          cleanBaseURL = cleanBaseURL.replace(
            /\/openai\/deployments\/[^\/]+\/chat\/completions$/,
            "",
          );

          // Remove any partial /openai/deployments paths
          cleanBaseURL = cleanBaseURL.replace(/\/openai\/deployments.*$/, "");

          // Remove any trailing /chat/completions
          cleanBaseURL = cleanBaseURL.replace(/\/chat\/completions$/, "");

          // Build the correct DIAL URL
          const dialModelURL = `${cleanBaseURL}/openai/deployments/${modelId}`;

          const dialProvider = createOpenAICompatible({
            name: "dial",
            baseURL: dialModelURL,
            headers: {
              "Api-Key": config.apiKey as string,
            },
          });

          // Return model with empty modelId since it's already in the URL
          return dialProvider("");
        };
      },
      fetchModelsMethod: function () {
        const url = process.env.DIAL_API_BASE_URL || "";
        return ModelFetcher.fetchDIALModels(url);
      },
    },
    huggingface: {
      name: "HuggingFace",
      envApiKey: "HuggingFace_API_KEY",
      createProviderFn: () => {
        return (_modelId: string) => {
          throw new Error("HuggingFace provider not yet implemented");
        };
      },
      additionalValidation: () => {
        logger.warning("HuggingFace provider detected but not yet implemented");
        return false;
      },
    },
  };

  /**
   * Generic provider initialization method that uses the factory pattern
   */
  protected initializeProvider(providerKey: string): ProviderConfig | null {
    const config = this.providerRegistry[providerKey];
    if (!config) {
      logger.warning(`No configuration found for provider: ${providerKey}`);
      return null;
    }

    // Check API key if needed
    if (config.requiresApiKey !== false && config.envApiKey) {
      if (!this.validateApiKey(process.env[config.envApiKey], config.name)) {
        return null;
      }
    }

    // Check base URL if needed
    let baseURL: string | undefined;
    if (config.baseUrlEnvName) {
      baseURL = process.env[config.baseUrlEnvName];
      if (!baseURL) {
        logger.warning(
          `${config.baseUrlEnvName} is required for ${config.name} provider`,
        );
        return null;
      }

      try {
        // Validate URL format
        new URL(baseURL);
      } catch (e) {
        logger.error(
          `Invalid URL format for ${config.name} provider: ${baseURL}`,
        );
        return null;
      }
    }

    // Create provider config with additional validation if needed
    return this.safeInitialize(config.name, () => {
      const providerConfig = {
        apiKey: config.envApiKey
          ? (process.env[config.envApiKey] as string)
          : undefined,
        baseURL,
      };

      // Run additional validation if provided
      if (
        config.additionalValidation &&
        !config.additionalValidation(providerConfig)
      ) {
        throw new Error(
          `Additional validation failed for ${config.name} provider`,
        );
      }

      // Set up fetch models method
      let fetchModels = config.fetchModelsMethod;

      return {
        name: config.name,
        provider: config.createProviderFn(providerConfig),
        isAvailable: true,
        fetchModels,
      };
    });
  }

  /**
   * Initialize OpenAI provider
   */
  public initializeOpenAI(): ProviderConfig | null {
    return this.initializeProvider("openai");
  }

  /**
   * Initialize Anthropic provider
   */
  public initializeAnthropic(): ProviderConfig | null {
    return this.initializeProvider("anthropic");
  }

  /**
   * Initialize Google provider
   */
  public initializeGoogle(): ProviderConfig | null {
    return this.initializeProvider("google");
  }

  /**
   * Initialize Mistral provider
   */
  public initializeMistral(): ProviderConfig | null {
    return this.initializeProvider("mistral");
  }

  /**
   * Initialize Groq provider
   */
  public initializeGroq(): ProviderConfig | null {
    return this.initializeProvider("groq");
  }

  /**
   * Initialize OpenRouter provider
   */
  public initializeOpenRouter(): ProviderConfig | null {
    return this.initializeProvider("openrouter");
  }

  /**
   * Initialize Ollama provider
   */
  public initializeOllama(): ProviderConfig | null {
    return this.initializeProvider("ollama");
  }

  /**
   * Initialize xAI provider
   */
  public initializeXAI(): ProviderConfig | null {
    return this.initializeProvider("xai");
  }

  /**
   * Initialize LMStudio provider
   */
  public initializeLMStudio(): ProviderConfig | null {
    return this.initializeProvider("lmstudio");
  }

  /**
   * Initialize AWS Bedrock provider
   */
  public initializeBedrock(): ProviderConfig | null {
    return this.initializeProvider("bedrock");
  }

  /**
   * Initialize DIAL provider
   */
  public initializeDIAL(): ProviderConfig | null {
    return this.initializeProvider("dial");
  }

  /**
   * Initialize HuggingFace provider (placeholder)
   */
  public initializeHuggingFace(): ProviderConfig | null {
    return this.initializeProvider("huggingface");
  }

  /**
   * Register a new provider or override an existing one
   * @param key The unique key for the provider
   * @param config The provider configuration
   * @returns The updated ProviderConfigs instance for chaining
   */
  public registerProvider(
    key: string,
    config: ProviderFactoryConfig,
  ): ProviderConfigs {
    if (!key || typeof key !== "string") {
      logger.error(`Invalid provider key: ${key}`);
      return this;
    }

    if (!config || typeof config !== "object") {
      logger.error(`Invalid provider configuration for ${key}`);
      return this;
    }

    if (!config.name) {
      logger.error(`Provider configuration for ${key} must include a name`);
      return this;
    }

    if (
      !config.createProviderFn ||
      typeof config.createProviderFn !== "function"
    ) {
      logger.error(
        `Provider configuration for ${key} must include a valid createProviderFn`,
      );
      return this;
    }

    // Clear this provider from cache if it exists
    this.providerCache.delete(key.toLowerCase());

    // Register the new provider
    this.providerRegistry[key.toLowerCase()] = config;
    logger.success(`Registered provider ${config.name} with key "${key}"`);

    return this;
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

  /**
   * Cache for lazy-loaded providers
   */
  private providerCache: Map<string, ProviderConfig | null> = new Map();

  /**
   * Get a provider with lazy initialization
   */
  public getProvider(providerName: string): ProviderConfig | null {
    const providerKey = providerName.toLowerCase();

    // Return cached provider if already initialized
    if (this.providerCache.has(providerKey)) {
      return this.providerCache.get(providerKey) || null;
    }

    // Check if it's a registered provider in our registry
    if (this.providerRegistry[providerKey]) {
      // Initialize using the factory pattern
      const config = this.initializeProvider(providerKey);
      this.providerCache.set(providerKey, config);
      return config;
    }

    // Fall back to legacy initializers if no registry entry
    const initializers = this.getAllProviderInitializers();
    const initializer = initializers[providerKey];
    if (!initializer) {
      logger.warning(`No initializer found for provider: ${providerName}`);
      return null;
    }

    // Initialize provider and cache result
    const config = initializer();
    this.providerCache.set(providerKey, config);
    return config;
  }

  /**
   * Check if a provider is healthy
   */
  public async checkProviderHealth(providerName: string): Promise<boolean> {
    const provider = this.getProvider(providerName);
    if (!provider || !provider.isAvailable) {
      return false;
    }

    try {
      // Call a simple API endpoint to verify the provider is working
      if (provider.fetchModels) {
        await provider.fetchModels();
        return true;
      }

      return true; // Assume healthy if no health check method available
    } catch (error) {
      logger.error(`Health check failed for ${providerName}:`, error);
      return false;
    }
  }

  /**
   * Get all registered provider keys
   * @returns Array of provider keys
   */
  public getRegisteredProviderKeys(): string[] {
    return Object.keys(this.providerRegistry);
  }
}
