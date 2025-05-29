import { openai, createOpenAI } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { mistral } from '@ai-sdk/mistral';
import { createGroq } from '@ai-sdk/groq';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createOllama } from 'ollama-ai-provider';
import { bedrock } from '@ai-sdk/amazon-bedrock';
import type { LanguageModelV1 } from '@ai-sdk/provider';
import { logger } from '@chara/logger';

/**
 * Represents an error that occurred during provider initialization
 */
interface InitializationError {
  provider: string;
  error: string;
}

/**
 * Represents a model available from a provider
 */
export interface ModelInfo {
  id: string;
  name?: string;
  description?: string;
  contextLength?: number;
  created?: number;
  ownedBy?: string;
}

/**
 * OpenAI API response types
 */
interface OpenAIModel {
  id: string;
  created: number;
  owned_by: string;
}

interface OpenAIModelsResponse {
  data: OpenAIModel[];
}

/**
 * Configuration object for an AI provider
 */
export interface ProviderConfig {
  /** Human-readable name of the provider */
  name: string;
  /** The AI SDK provider factory function */
  provider: (modelId: string) => LanguageModelV1;
  /** Whether the provider is available and properly initialized */
  isAvailable: boolean;
  /** Function to fetch available models from the provider */
  fetchModels?: () => Promise<ModelInfo[]>;
}

/**
 * Registry for AI providers that automatically initializes providers based on environment variables.
 *
 * Environment variables should follow the pattern: {PROVIDER_NAME}_API_KEY
 *
 * Supported providers:
 * - OPENAI_API_KEY: OpenAI GPT models (specify model when calling getModel)
 * - ANTHROPIC_API_KEY: Anthropic Claude models (specify model when calling getModel)
 * - GOOGLE_GENERATIVE_AI_API_KEY: Google Gemini models (specify model when calling getModel)
 * - MISTRAL_API_KEY: Mistral AI models (specify model when calling getModel)
 * - GROQ_API_KEY: Groq models (specify model when calling getModel)
 * - OPEN_ROUTER_API_KEY: OpenRouter models (specify model when calling getModel)
 * - XAI_API_KEY: xAI Grok models (specify model when calling getModel)
 * - OLLAMA_API_BASE_URL: Local Ollama instance (specify model when calling getModel)
 * - AWS_BEDROCK_CONFIG: AWS Bedrock (JSON config, specify model when calling getModel)
 * - HuggingFace_API_KEY: HuggingFace models (placeholder, not yet implemented)
 *
 * @example
 * ```typescript
 * import { providersRegistry, getModel } from './providers-registry';
 *
 * // Get a specific model
 * const openaiModel = getModel('openai', 'gpt-4o');
 *
 * // List available providers
 * const providers = providersRegistry.getAvailableProviders();
 * console.log('Available providers:', providers.map(p => p.name));
 *
 * // Note: Models are specified when calling getModel(), not stored in the registry
 *
 * // Check if a provider is available
 * if (providersRegistry.hasProvider('anthropic')) {
 *   const claudeModel = getModel('anthropic', 'claude-3-5-sonnet-20241022');
 * }
 * ```
 */
export class ProvidersRegistry {
  private providers: Map<string, ProviderConfig> = new Map();
  private initializationErrors: InitializationError[] = [];

  constructor() {
    this.initializeProviders();
  }

  /**
   * Validates that an API key is present and not empty
   * @param apiKey - The API key to validate
   * @param providerName - Name of the provider for logging
   * @returns true if the API key is valid, false otherwise
   */
  private validateApiKey(
    apiKey: string | undefined,
    providerName: string,
  ): boolean {
    if (!apiKey || apiKey.trim() === "") {
      logger.warning(
        `${providerName} API key not found or empty - skipping initialization`,
      );
      return false;
    }
    return true;
  }

  /**
   * Logs the initialization status of a provider and tracks errors
   * @param provider - Name of the provider
   * @param status - Whether initialization succeeded or failed
   * @param error - Error message if initialization failed
   */
  private logProviderStatus(
    provider: string,
    status: "success" | "failed",
    error?: string,
  ): void {
    if (status === "success") {
      logger.success(`${provider} provider initialized successfully`);
    } else {
      logger.error(`${provider} provider initialization failed: ${error}`);
      this.initializationErrors.push({
        provider,
        error: error || "Unknown error",
      });
    }
  }

  private initializeProviders(): void {
    // OpenAI
    if (this.validateApiKey(process.env.OPENAI_API_KEY, "OpenAI")) {
      try {
        this.providers.set("openai", {
          name: "OpenAI",
          provider: (modelId: string) => openai(modelId),
          isAvailable: true,
          fetchModels: async () => this.fetchOpenAIModels(),
        });
        this.logProviderStatus("OpenAI", "success");
      } catch (error) {
        this.logProviderStatus(
          "OpenAI",
          "failed",
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    }

    // Anthropic
    if (this.validateApiKey(process.env.ANTHROPIC_API_KEY, "Anthropic")) {
      try {
        this.providers.set("anthropic", {
          name: "Anthropic",
          provider: (modelId: string) => anthropic(modelId),
          isAvailable: true,
        });
        this.logProviderStatus("Anthropic", "success");
      } catch (error) {
        this.logProviderStatus(
          "Anthropic",
          "failed",
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    }

    // Google
    if (
      this.validateApiKey(process.env.GOOGLE_GENERATIVE_AI_API_KEY, "Google")
    ) {
      try {
        this.providers.set("google", {
          name: "Google",
          provider: (modelId: string) => google(modelId),
          isAvailable: true,
        });
        this.logProviderStatus("Google", "success");
      } catch (error) {
        this.logProviderStatus(
          "Google",
          "failed",
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    }

    // Mistral
    if (this.validateApiKey(process.env.MISTRAL_API_KEY, "Mistral")) {
      try {
        this.providers.set("mistral", {
          name: "Mistral",
          provider: (modelId: string) => mistral(modelId),
          isAvailable: true,
        });
        this.logProviderStatus("Mistral", "success");
      } catch (error) {
        this.logProviderStatus(
          "Mistral",
          "failed",
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    }

    // Groq
    if (this.validateApiKey(process.env.GROQ_API_KEY, "Groq")) {
      try {
        const groqProvider = createGroq({
          apiKey: process.env.GROQ_API_KEY as string,
        });
        this.providers.set("groq", {
          name: "Groq",
          provider: (modelId: string) => groqProvider(modelId),
          isAvailable: true,
        });
        this.logProviderStatus("Groq", "success");
      } catch (error) {
        this.logProviderStatus(
          "Groq",
          "failed",
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    }

    // OpenRouter
    if (this.validateApiKey(process.env.OPEN_ROUTER_API_KEY, "OpenRouter")) {
      try {
        const openRouterProvider = createOpenRouter({
          apiKey: process.env.OPEN_ROUTER_API_KEY as string,
        });
        this.providers.set("openrouter", {
          name: "OpenRouter",
          provider: (modelId: string) => openRouterProvider(modelId),
          isAvailable: true,
        });
        this.logProviderStatus("OpenRouter", "success");
      } catch (error) {
        this.logProviderStatus(
          "OpenRouter",
          "failed",
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    }

    // Ollama
    if (process.env.OLLAMA_API_BASE_URL) {
      try {
        // Validate URL format
        new URL(process.env.OLLAMA_API_BASE_URL);
        const ollamaProvider = createOllama({
          baseURL: process.env.OLLAMA_API_BASE_URL,
        });
        this.providers.set("ollama", {
          name: "Ollama",
          provider: (modelId: string) => ollamaProvider(modelId),
          isAvailable: true,
        });
        this.logProviderStatus("Ollama", "success");
      } catch (error) {
        this.logProviderStatus("Ollama", "failed", "Invalid base URL format");
      }
    }

    // XAI (using OpenAI-compatible interface)
    if (this.validateApiKey(process.env.XAI_API_KEY, "xAI")) {
      try {
        const xaiProvider = createOpenAI({
          apiKey: process.env.XAI_API_KEY as string,
          baseURL: "https://api.x.ai/v1",
        });
        this.providers.set("xai", {
          name: "xAI",
          provider: (modelId: string) => xaiProvider(modelId),
          isAvailable: true,
        });
        this.logProviderStatus("xAI", "success");
      } catch (error) {
        this.logProviderStatus(
          "xAI",
          "failed",
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    }

    // AWS Bedrock
    if (process.env.AWS_BEDROCK_CONFIG) {
      try {
        const config = JSON.parse(process.env.AWS_BEDROCK_CONFIG);
        const bedrockProvider = bedrock(config);
        this.providers.set("bedrock", {
          name: "AWS Bedrock",
          provider: (modelId: string) => bedrockProvider,
          isAvailable: true,
        });
        this.logProviderStatus("AWS Bedrock", "success");
      } catch (error) {
        this.logProviderStatus(
          "AWS Bedrock",
          "failed",
          "Failed to parse AWS_BEDROCK_CONFIG",
        );
      }
    }

    // HuggingFace (placeholder - would need specific implementation)
    if (this.validateApiKey(process.env.HuggingFace_API_KEY, "HuggingFace")) {
      // Note: HuggingFace would need a custom provider implementation
      // This is a placeholder for future implementation
      this.providers.set("huggingface", {
        name: "HuggingFace",
        provider: (_modelId: string) => {
          throw new Error("HuggingFace provider not yet implemented");
        },
        isAvailable: false, // Set to false until implemented
      });
      logger.warning("HuggingFace provider detected but not yet implemented");
    }

    // Log initialization summary
    const totalProviders = this.providers.size;
    const availableProviders = this.getAvailableProviders().length;
    logger.info("Provider Registry Summary:", {
      totalProviders,
      availableProviders,
      failedInitializations: this.initializationErrors.length,
    });

    if (this.initializationErrors.length > 0) {
      logger.warning("Initialization Errors:", {
        errors: this.initializationErrors,
      });
    }
  }

  /**
   * Gets a provider configuration by name
   * @param name - The provider name (e.g., 'openai', 'anthropic')
   * @returns The provider configuration or undefined if not found
   */
  public getProvider(name: string): ProviderConfig | undefined {
    return this.providers.get(name);
  }

  /**
   * Gets all providers that are available and properly initialized
   * @returns Array of available provider configurations
   */
  public getAvailableProviders(): ProviderConfig[] {
    return Array.from(this.providers.values()).filter((p) => p.isAvailable);
  }

  /**
   * Gets the names of all configured providers (both available and unavailable)
   * @returns Array of provider names
   */
  public getProviderNames(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Checks if a provider is available
   * @param name - The provider name to check
   * @returns true if the provider is available, false otherwise
   */
  public hasProvider(name: string): boolean {
    const provider = this.providers.get(name);
    return provider ? provider.isAvailable : false;
  }

  /**
   * Gets a model instance from a provider
   * @param providerName - The name of the provider (e.g., 'openai', 'anthropic')
   * @param modelName - Required model name for the provider
   * @returns The model instance ready for use with the AI SDK
   * @throws Error if the provider is not available
   *
   * @example
   * ```typescript
   * // Get a specific model
   * const gpt4 = registry.getModel('openai', 'gpt-4o');
   * const claude = registry.getModel('anthropic', 'claude-3-5-sonnet-20241022');
   * ```
   */
  public getModel(providerName: string, modelName: string): unknown {
    const provider = this.getProvider(providerName);
    if (!provider || !provider.isAvailable) {
      throw new Error(`Provider ${providerName} is not available`);
    }

    if (!modelName) {
      throw new Error(`Model name is required for provider ${providerName}`);
    }

    return provider.provider(modelName);
  }

  /**
   * Fetches available models for a specific provider
   * @param providerName - The name of the provider
   * @returns Array of available models
   * @throws Error if the provider is not available or doesn't support model fetching
   */
  public async fetchModels(providerName: string): Promise<ModelInfo[]> {
    const provider = this.getProvider(providerName);
    if (!provider || !provider.isAvailable) {
      throw new Error(`Provider ${providerName} is not available`);
    }

    if (!provider.fetchModels) {
      throw new Error(`Provider ${providerName} does not support model fetching`);
    }

    try {
      return await provider.fetchModels();
    } catch (error) {
      logger.error(`Failed to fetch models for ${providerName}:`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`Failed to fetch models for ${providerName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetches available models for all providers that support it
   * @returns Object mapping provider names to their available models
   */
  public async fetchAllModels(): Promise<Record<string, ModelInfo[]>> {
    const results: Record<string, ModelInfo[]> = {};
    const availableProviders = this.getAvailableProviders().filter(p => p.fetchModels);

    const fetchPromises = availableProviders.map(async (provider) => {
      const providerName = provider.name.toLowerCase();
      try {
        const models = await this.fetchModels(providerName);
        results[providerName] = models;
      } catch (error) {
        logger.warning(`Failed to fetch models for ${provider.name}:`, {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        results[providerName] = [];
      }
    });

    await Promise.all(fetchPromises);
    return results;
  }

  // Provider-specific model fetching methods
  private async fetchOpenAIModels(): Promise<ModelInfo[]> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as OpenAIModelsResponse;
      return data.data.map((model: OpenAIModel) => ({
        id: model.id,
        name: model.id,
        created: model.created,
        ownedBy: model.owned_by,
      }));
    } catch (error) {
      // Fallback to known models if API fails
      return [
        { id: 'gpt-4o', name: 'GPT-4o' },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
      ];
    }
  }

  public getAvailableProviderNames(): string[] {
    return this.getAvailableProviders().map((p) => p.name.toLowerCase());
  }

  /**
   * Gets all initialization errors that occurred during provider setup
   * @returns Array of initialization errors
   */
  public getInitializationErrors(): InitializationError[] {
    return [...this.initializationErrors];
  }

  /**
   * Gets the status of all providers including availability and any errors
   * @returns Object mapping provider names to their status and potential errors
   */
  public getProviderStatus(): {
    [key: string]: { available: boolean; error?: string };
  } {
    const status: { [key: string]: { available: boolean; error?: string } } =
      {};

    for (const [name, config] of this.providers) {
      status[name] = { available: config.isAvailable };
    }

    for (const error of this.initializationErrors) {
      const providerKey = error.provider.toLowerCase();
      const providerStatus = status[providerKey];
      if (providerStatus) {
        providerStatus.error = error.error;
      }
    }

    return status;
  }
}

// Create and export a singleton instance
export const providersRegistry = new ProvidersRegistry();

/**
 * Convenience functions for accessing the singleton registry
 */

/** Get a provider configuration by name */
export const getProvider = (name: string) =>
  providersRegistry.getProvider(name);

/** Get all available providers */
export const getAvailableProviders = () =>
  providersRegistry.getAvailableProviders();

/** Get a model instance from a provider */
export const getModel = (providerName: string, modelName: string) =>
  providersRegistry.getModel(providerName, modelName);

/** Check if a provider is available */
export const hasProvider = (name: string) =>
  providersRegistry.hasProvider(name);

/** Fetch available models for a specific provider */
export const fetchModels = (providerName: string) =>
  providersRegistry.fetchModels(providerName);

/** Fetch available models for all providers */
export const fetchAllModels = () =>
  providersRegistry.fetchAllModels();
