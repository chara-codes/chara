import { logger } from "@chara/logger";
import type { LanguageModelV1 } from "ai";
import { ModelFetcher } from "./model-fetcher";
import { ProviderConfigs } from "./provider-configs";
import type { InitializationError, ModelInfo, ProviderConfig } from "./types";

/**
 * Registry for AI providers that initializes providers based on environment variables.
 *
 * IMPORTANT: Must call initialize() before using any providers.
 *
 * Environment variables should follow the pattern: {PROVIDER_NAME}_API_KEY
 *
 * Supported providers:
 * - OPENAI_API_KEY: OpenAI GPT models (specify model when calling getModel)
 * - ANTHROPIC_API_KEY: Anthropic Claude models (specify model when calling getModel)
 * - GOOGLE_GENERATIVE_AI_API_KEY: Google Gemini models (specify model when calling getModel)
 * - DEEPSEEK_API_KEY: DeepSeek models (specify model when calling getModel)
 * - OPEN_ROUTER_API_KEY: OpenRouter models (specify model when calling getModel)
 * - OLLAMA_API_BASE_URL: Local Ollama instance (specify model when calling getModel)
 * - LMSTUDIO_API_BASE_URL: Local LMStudio instance (specify model when calling getModel)
 * - AWS_BEDROCK_CONFIG: AWS Bedrock (JSON config, specify model when calling getModel)
 * - DIAL_API_KEY + DIAL_API_BASE_URL: DIAL compatible API endpoint (specify model when calling getModel)
 *
 * @example
 * ```typescript
 * import { providersRegistry, getModel, initialize } from './providers-registry';
 *
 * // Initialize providers first
 * await initialize();
 *
 * // Get a specific model
 * const openaiModel = getModel('openai', 'gpt-4o');
 *
 * // List available providers
 * const providers = await providersRegistry.getAvailableProviders();
 * console.log('Available providers:', providers.map(p => p.name));
 *
 * // Note: Models are specified when calling getModel(), not stored in the registry
 *
 * // Check if a provider is available
 * if (await providersRegistry.hasProvider('anthropic')) {
 *   const claudeModel = await getModel('anthropic', 'claude-3-5-sonnet-20241022');
 * }
 *
 * // Use DeepSeek models
 * const deepseekChat = await getModel('deepseek', 'deepseek-chat');
 * const deepseekReasoner = await getModel('deepseek', 'deepseek-reasoner');
 *
 * // Reinitialize when settings change
 * await providersRegistry.initialize();
 * ```
 */
export class ProvidersRegistry {
  private providers: Map<string, ProviderConfig> = new Map();
  private providerConfigs: ProviderConfigs;
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.providerConfigs = new ProviderConfigs();
  }

  /**
   * Initialize or reinitialize all available providers
   * Can be called multiple times to pick up configuration changes
   */
  public async initialize(): Promise<void> {
    // If already initialized or in progress, clear state first
    if (this.initialized || this.initializationPromise) {
      // Clear existing state
      this.providers.clear();
      this.initialized = false;
      this.initializationPromise = null;

      // Clear cache from existing provider configs
      this.providerConfigs.clearCache();

      // Reinitialize provider configs to pick up new settings
      this.providerConfigs = new ProviderConfigs();
    }

    this.initializationPromise = this.doInitializeProviders();
    return this.initializationPromise;
  }

  /**
   * Async initialization implementation
   */
  private async doInitializeProviders(): Promise<void> {
    const initializers = this.providerConfigs.getAllProviderInitializers();

    for (const [providerKey, initializer] of Object.entries(initializers)) {
      const config = await initializer();
      if (config) {
        this.providers.set(providerKey, config);
      }
    }

    this.initialized = true;

    // Log initialization summary
    const totalProviders = this.providers.size;
    const availableProviders = (await this.getAvailableProviders()).length;
    const initializationErrors = this.getInitializationErrors();

    logger.debug("Provider Registry Summary:", {
      totalProviders,
      availableProviders,
      failedInitializations: initializationErrors.length,
    });

    if (initializationErrors.length > 0) {
      logger.debug("Initialization Errors:", {
        errors: initializationErrors,
      });
    }
  }

  /**
   * Ensure providers are initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      if (!this.initializationPromise) {
        throw new Error("Providers not initialized. Call initialize() first.");
      }
      await this.initializationPromise;
    }
  }

  /**
   * Gets a provider configuration by name
   * @param name - The provider name (e.g., 'openai', 'anthropic')
   * @returns The provider configuration or undefined if not found
   */
  public async getProvider(name: string): Promise<ProviderConfig | undefined> {
    await this.ensureInitialized();
    return this.providers.get(name);
  }

  /**
   * Gets all providers that are available and properly initialized
   * @returns Array of available provider configurations
   */
  public async getAvailableProviders(): Promise<ProviderConfig[]> {
    await this.ensureInitialized();
    return Array.from(this.providers.values()).filter((p) => p.isAvailable);
  }

  /**
   * Gets the names of all configured providers (both available and unavailable)
   * @returns Array of provider names
   */
  public async getProviderNames(): Promise<string[]> {
    await this.ensureInitialized();
    return Array.from(this.providers.keys());
  }

  /**
   * Gets the names of all available providers
   * @returns Array of available provider names
   */
  public async getAvailableProviderNames(): Promise<string[]> {
    const providers = await this.getAvailableProviders();
    return providers.map((p) => p.name.toLowerCase());
  }

  /**
   * Checks if a provider is available
   * @param name - The provider name to check
   * @returns true if the provider is available, false otherwise
   */
  public async hasProvider(name: string): Promise<boolean> {
    await this.ensureInitialized();
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
   * const deepseek = registry.getModel('deepseek', 'deepseek-chat');
   * ```
   */
  public async getModel(
    providerName: string,
    modelName: string,
  ): Promise<LanguageModelV1> {
    const provider = await this.getProvider(providerName);
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
    const provider = await this.getProvider(providerName);
    if (!provider || !provider.isAvailable) {
      throw new Error(`Provider ${providerName} is not available`);
    }

    if (!provider.fetchModels) {
      throw new Error(
        `Provider ${providerName} does not support model fetching`,
      );
    }

    return ModelFetcher.fetchModelsForProvider(
      providerName,
      provider.fetchModels,
    );
  }

  /**
   * Fetches available models for all providers that support it
   * @returns Object mapping provider names to their available models
   */
  public async fetchAllModels(): Promise<Record<string, ModelInfo[]>> {
    const results: Record<string, ModelInfo[]> = {};
    const availableProviders = (await this.getAvailableProviders()).filter(
      (p) => p.fetchModels,
    );
    const fetchPromises = availableProviders.map(async (provider) => {
      const providerName = provider.name.toLowerCase();
      try {
        const models = await this.fetchModels(providerName);
        results[providerName] = models;
      } catch (error) {
        logger.warning(`Failed to fetch models for ${provider.name}:`, {
          error: error instanceof Error ? error.message : "Unknown error",
        });
        results[providerName] = [];
      }
    });

    await Promise.all(fetchPromises);
    return results;
  }

  /**
   * Gets all initialization errors that occurred during provider setup
   * @returns Array of initialization errors
   */
  public getInitializationErrors(): InitializationError[] {
    return this.providerConfigs.getInitializationErrors();
  }

  /**
   * Gets the status of all providers including availability and any errors
   * @returns Object mapping provider names to their status and potential errors
   */
  public async getProviderStatus(): Promise<{
    [key: string]: { available: boolean; error?: string };
  }> {
    await this.ensureInitialized();
    const status: { [key: string]: { available: boolean; error?: string } } =
      {};

    for (const [name, config] of this.providers) {
      status[name] = { available: config.isAvailable };
    }

    const initializationErrors = this.getInitializationErrors();
    for (const error of initializationErrors) {
      const providerKey = error.provider.toLowerCase();
      const providerStatus = status[providerKey];
      if (providerStatus) {
        providerStatus.error = error.error;
      }
    }

    return status;
  }
}
