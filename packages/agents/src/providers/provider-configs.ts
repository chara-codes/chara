import { createAnthropic } from "@ai-sdk/anthropic";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModelV1 } from "@ai-sdk/provider";
import { logger } from "@chara/logger";
import { getVarFromEnvOrGlobalConfig } from "@chara/settings";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createOllama } from "ollama-ai-provider";
import { BaseProviderInitializer } from "./base-initializer";
import { ModelFetcher } from "./model-fetcher";
import type { ProviderConfig } from "./types";

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
      createProviderFn: (config) => {
        const openai = createOpenAI({
          apiKey: config.apiKey,
        });
        return (modelId: string) => openai(modelId);
      },
      fetchModelsMethod: ModelFetcher.fetchOpenAIModels,
    },
    anthropic: {
      name: "Anthropic",
      envApiKey: "ANTHROPIC_API_KEY",
      createProviderFn: (config) => {
        const anthropic = createAnthropic({
          apiKey: config.apiKey,
        });
        return (modelId: string) => anthropic(modelId);
      },
      fetchModelsMethod: ModelFetcher.fetchAnthropicModels,
    },
    google: {
      name: "Google",
      envApiKey: "GOOGLE_GENERATIVE_AI_API_KEY",
      createProviderFn: (config) => {
        const google = createGoogleGenerativeAI({
          apiKey: config.apiKey,
        });
        return (modelId: string) => google(modelId);
      },
      fetchModelsMethod: ModelFetcher.fetchGoogleModels,
    },
    deepseek: {
      name: "DeepSeek",
      envApiKey: "DEEPSEEK_API_KEY",
      createProviderFn: (config) => {
        const deepseek = createDeepSeek({
          apiKey: config.apiKey,
        });
        return (modelId: string) => {
          return deepseek(modelId);
        };
      },
      fetchModelsMethod: ModelFetcher.fetchDeepSeekModels,
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
      fetchModelsMethod: async () => {
        const url = await getVarFromEnvOrGlobalConfig("LMSTUDIO_API_BASE_URL");
        return ModelFetcher.fetchLMStudioModels(url || "");
      },
    },

    dial: {
      name: "DIAL",
      envApiKey: "DIAL_API_KEY",
      baseUrlEnvName: "DIAL_API_BASE_URL",
      createProviderFn: (config) => {
        return (modelId: string) => {
          // DIAL expects model in URL path: baseURL/openai/deployments/{modelId}/chat/completions
          const baseURL = config.baseURL as string;

          // Build the correct DIAL URL
          const dialModelURL = `${baseURL}/${modelId}`;

          const dialProvider = createOpenAICompatible({
            name: "dial",
            baseURL: dialModelURL,
            headers: {
              "Api-Key": config.apiKey as string,
            },
          });
          return dialProvider(modelId);
        };
      },
      fetchModelsMethod: async () => {
        const url = await getVarFromEnvOrGlobalConfig("DIAL_API_BASE_URL");
        return ModelFetcher.fetchDIALModels(url || "");
      },
    },
  };

  /**
   * Generic provider initialization method that uses the factory pattern
   */
  protected async initializeProvider(
    providerKey: string,
  ): Promise<ProviderConfig | null> {
    const config = this.providerRegistry[providerKey];
    if (!config) {
      logger.warning(`No configuration found for provider: ${providerKey}`);
      return null;
    }

    // Get API key with fallback to global config
    let apiKey: string | undefined;
    if (config.requiresApiKey !== false && config.envApiKey) {
      apiKey = await getVarFromEnvOrGlobalConfig(config.envApiKey);
      if (!this.validateApiKey(apiKey, config.name)) {
        return null;
      }
    }

    // Get base URL with fallback to global config
    let baseURL: string | undefined;
    if (config.baseUrlEnvName) {
      baseURL = await getVarFromEnvOrGlobalConfig(config.baseUrlEnvName);
      if (!baseURL) {
        logger.debug(
          `${config.baseUrlEnvName} or global config baseURL is required for ${config.name} provider`,
        );
        return null;
      }

      try {
        // Validate URL format
        new URL(baseURL);
      } catch (error) {
        logger.error(
          `Invalid URL format for ${config.name} provider: ${baseURL}`,
        );
        return null;
      }
    }

    // Create provider config with additional validation if needed
    return this.safeInitialize(config.name, () => {
      const providerConfig = {
        apiKey,
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
      const fetchModels = config.fetchModelsMethod;

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
  public async initializeOpenAI(): Promise<ProviderConfig | null> {
    return await this.initializeProvider("openai");
  }

  /**
   * Initialize Anthropic provider
   */
  public async initializeAnthropic(): Promise<ProviderConfig | null> {
    return await this.initializeProvider("anthropic");
  }

  /**
   * Initialize Google provider
   */
  public async initializeGoogle(): Promise<ProviderConfig | null> {
    return await this.initializeProvider("google");
  }

  /**
   * Initialize OpenRouter provider
   */
  public async initializeOpenRouter(): Promise<ProviderConfig | null> {
    return await this.initializeProvider("openrouter");
  }

  /**
   * Initialize Ollama provider
   */
  public async initializeOllama(): Promise<ProviderConfig | null> {
    return await this.initializeProvider("ollama");
  }

  /**
   * Initialize LMStudio provider
   */
  public async initializeLMStudio(): Promise<ProviderConfig | null> {
    return await this.initializeProvider("lmstudio");
  }

  /**
   * Initialize DIAL provider
   */
  public async initializeDIAL(): Promise<ProviderConfig | null> {
    return await this.initializeProvider("dial");
  }

  /**
   * Initialize DeepSeek provider
   */
  public async initializeDeepSeek(): Promise<ProviderConfig | null> {
    return await this.initializeProvider("deepseek");
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
    () => Promise<ProviderConfig | null>
  > {
    return {
      openai: () => this.initializeOpenAI(),
      anthropic: () => this.initializeAnthropic(),
      google: () => this.initializeGoogle(),
      openrouter: () => this.initializeOpenRouter(),
      ollama: () => this.initializeOllama(),
      lmstudio: () => this.initializeLMStudio(),
      dial: () => this.initializeDIAL(),
      deepseek: () => this.initializeDeepSeek(),
    };
  }

  /**
   * Cache for lazy-loaded providers
   */
  private providerCache: Map<string, ProviderConfig | null> = new Map();

  /**
   * Get a provider with lazy initialization
   */
  public async getProvider(
    providerName: string,
  ): Promise<ProviderConfig | null> {
    const providerKey = providerName.toLowerCase();

    // Return cached provider if already initialized
    if (this.providerCache.has(providerKey)) {
      return this.providerCache.get(providerKey) || null;
    }

    // Check if it's a registered provider in our registry
    if (this.providerRegistry[providerKey]) {
      // Initialize using the factory pattern
      const config = await this.initializeProvider(providerKey);
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
    const config = await initializer();
    this.providerCache.set(providerKey, config);
    return config;
  }

  /**
   * Check if a provider is healthy
   */
  public async checkProviderHealth(providerName: string): Promise<boolean> {
    const provider = await this.getProvider(providerName);
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
   * Clear the provider cache (useful for reinitialization)
   */
  public clearCache(): void {
    this.providerCache.clear();
  }

  /**
   * Get all registered provider keys
   * @returns Array of provider keys
   */
  public getRegisteredProviderKeys(): string[] {
    return Object.keys(this.providerRegistry);
  }
}
