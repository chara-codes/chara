import { logger } from "@chara-codes/logger";
import { BaseProviderInitializer } from "./base-initializer";
import { allProviders, providerKeys, type BaseProvider } from "./providers";
import type { ProviderConfig } from "./types";

/**
 * Legacy provider factory configuration type for backward compatibility
 */
export interface ProviderFactoryConfig {
  name: string;
  envApiKey?: string;
  baseUrlEnvName?: string;
  createProviderFn: (config: Record<string, any>) => (modelId: string) => any;
  fetchModelsMethod?: () => Promise<any[]>;
  additionalValidation?: (config: Record<string, any>) => boolean;
  requiresApiKey?: boolean;
}

/**
 * Provider configuration management using the new provider structure
 */
export class ProviderConfigs extends BaseProviderInitializer {
  /**
   * Cache for initialized providers
   */
  private providerCache: Map<string, ProviderConfig | null> = new Map();

  /**
   * Registry of custom providers (for extensibility)
   */
  private customProviders: Map<string, BaseProvider> = new Map();

  /**
   * Initialize a provider by key
   */
  private async initializeProvider(
    providerKey: string
  ): Promise<ProviderConfig | null> {
    // Check if it's a built-in provider
    const builtInProvider =
      allProviders[providerKey as keyof typeof allProviders];
    if (builtInProvider) {
      return await this.initializeProviderInstance(builtInProvider);
    }

    // Check if it's a custom provider
    const customProvider = this.customProviders.get(providerKey);
    if (customProvider) {
      return await this.initializeProviderInstance(customProvider);
    }

    logger.warning(`No provider found for key: ${providerKey}`);
    return null;
  }

  /**
   * Initialize a provider instance
   */
  private async initializeProviderInstance(
    provider: BaseProvider
  ): Promise<ProviderConfig | null> {
    return await this.safeInitialize(provider.name, async () => {
      // Check if provider can be initialized
      if (!(await provider.canInitialize())) {
        throw new Error(`Provider ${provider.name} cannot be initialized`);
      }

      // Create the provider factory
      const providerFactory = await provider.createProvider();

      // Create the provider config
      const config: ProviderConfig = {
        name: provider.name,
        provider: providerFactory,
        isAvailable: true,
        fetchModels: provider.fetchModels
          ? () => provider.fetchModels()
          : undefined,
      };

      return config;
    });
  }

  /**
   * Safe initialization wrapper that handles async operations
   */
  protected async safeInitialize(
    providerName: string,
    initFn: () => Promise<ProviderConfig>
  ): Promise<ProviderConfig | null> {
    try {
      const config = await initFn();
      this.logProviderStatus(providerName, "success");
      return config;
    } catch (error) {
      this.logProviderStatus(
        providerName,
        "failed",
        error instanceof Error ? error.message : "Unknown error"
      );
      return null;
    }
  }

  /**
   * Register a custom provider
   * Supports both new BaseProvider interface and legacy ProviderFactoryConfig
   */
  public registerProvider(
    key: string,
    providerOrConfig: BaseProvider | ProviderFactoryConfig
  ): ProviderConfigs {
    if (!key || typeof key !== "string") {
      logger.error(`Invalid provider key: ${key}`);
      return this;
    }

    if (!providerOrConfig || typeof providerOrConfig !== "object") {
      logger.error(`Invalid provider for ${key}`);
      return this;
    }

    // Check if it's a BaseProvider instance
    if (
      "createProvider" in providerOrConfig &&
      typeof providerOrConfig.createProvider === "function"
    ) {
      const provider = providerOrConfig as BaseProvider;

      if (!provider.name) {
        logger.error(
          `Provider for ${key} must have a name and createProvider method`
        );
        return this;
      }

      // Clear cache for this provider
      this.providerCache.delete(key.toLowerCase());

      // Register the provider
      this.customProviders.set(key.toLowerCase(), provider);
      logger.success(
        `Registered custom provider ${provider.name} with key "${key}"`
      );

      return this;
    }

    // Handle legacy ProviderFactoryConfig format
    const config = providerOrConfig as ProviderFactoryConfig;

    if (!config.name) {
      logger.error(`Provider configuration for ${key} must include a name`);
      return this;
    }

    if (
      !config.createProviderFn ||
      typeof config.createProviderFn !== "function"
    ) {
      logger.error(
        `Provider configuration for ${key} must include a valid createProviderFn`
      );
      return this;
    }

    // Create a BaseProvider adapter for the legacy config
    const legacyProvider: BaseProvider = {
      key: key.toLowerCase(),
      name: config.name,
      requiresApiKey: config.requiresApiKey !== false,
      apiKeyEnvVar: config.envApiKey,
      baseUrlEnvVar: config.baseUrlEnvName,

      async canInitialize(): Promise<boolean> {
        // For legacy configs, assume they can always initialize
        return true;
      },

      async createProvider() {
        // Call the legacy createProviderFn with empty config
        return config.createProviderFn({});
      },

      async fetchModels() {
        if (config.fetchModelsMethod) {
          return config.fetchModelsMethod();
        }
        return [];
      },

      validateConfig: config.additionalValidation,
    };

    // Clear cache for this provider
    this.providerCache.delete(key.toLowerCase());

    // Register the adapted provider
    this.customProviders.set(key.toLowerCase(), legacyProvider);
    logger.success(
      `Registered legacy provider ${config.name} with key "${key}"`
    );

    return this;
  }

  /**
   * Get a provider with lazy initialization
   */
  public async getProvider(
    providerName: string
  ): Promise<ProviderConfig | null> {
    const providerKey = providerName.toLowerCase();

    // Return cached provider if already initialized
    if (this.providerCache.has(providerKey)) {
      return this.providerCache.get(providerKey) || null;
    }

    // Initialize provider
    const config = await this.initializeProvider(providerKey);
    this.providerCache.set(providerKey, config);
    return config;
  }

  /**
   * Get all available provider initializers
   */
  public getAllProviderInitializers(): Record<
    string,
    () => Promise<ProviderConfig | null>
  > {
    const initializers: Record<string, () => Promise<ProviderConfig | null>> =
      {};

    // Add built-in providers
    for (const key of providerKeys) {
      initializers[key] = () => this.getProvider(key);
    }

    // Add custom providers
    for (const key of Array.from(this.customProviders.keys())) {
      initializers[key] = () => this.getProvider(key);
    }

    return initializers;
  }

  /**
   * Clear the provider cache
   */
  public clearCache(): void {
    this.providerCache.clear();
  }

  /**
   * Get all registered provider keys (built-in + custom)
   */
  public getRegisteredProviderKeys(): string[] {
    return [...providerKeys, ...Array.from(this.customProviders.keys())];
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
      // Try to fetch models as a health check
      if (provider.fetchModels) {
        await provider.fetchModels();
      }
      return true;
    } catch (error) {
      logger.error(`Health check failed for ${providerName}:`, error);
      return false;
    }
  }

  /**
   * Legacy method compatibility - Initialize OpenAI
   */
  public async initializeOpenAI(): Promise<ProviderConfig | null> {
    return await this.getProvider("openai");
  }

  /**
   * Legacy method compatibility - Initialize Anthropic
   */
  public async initializeAnthropic(): Promise<ProviderConfig | null> {
    return await this.getProvider("anthropic");
  }

  /**
   * Legacy method compatibility - Initialize Google
   */
  public async initializeGoogle(): Promise<ProviderConfig | null> {
    return await this.getProvider("google");
  }

  /**
   * Legacy method compatibility - Initialize OpenRouter
   */
  public async initializeOpenRouter(): Promise<ProviderConfig | null> {
    return await this.getProvider("openrouter");
  }

  /**
   * Legacy method compatibility - Initialize Ollama
   */
  public async initializeOllama(): Promise<ProviderConfig | null> {
    return await this.getProvider("ollama");
  }

  /**
   * Legacy method compatibility - Initialize LMStudio
   */
  public async initializeLMStudio(): Promise<ProviderConfig | null> {
    return await this.getProvider("lmstudio");
  }

  /**
   * Legacy method compatibility - Initialize DIAL
   */
  public async initializeDIAL(): Promise<ProviderConfig | null> {
    return await this.getProvider("dial");
  }

  /**
   * Legacy method compatibility - Initialize DeepSeek
   */
  public async initializeDeepSeek(): Promise<ProviderConfig | null> {
    return await this.getProvider("deepseek");
  }
}
