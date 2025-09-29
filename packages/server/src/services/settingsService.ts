import {
  readGlobalConfig,
  updateGlobalConfig,
  existsGlobalConfig
} from "@chara-codes/settings";
import { getAgentsApiUrl } from "../config/env";

import {
  type SettingsProviderConfig,
  type ExtendedGlobalSettings,
  type CreateProviderInput,
  PROVIDER_CONFIGS,
  SettingsErrorType,
  type SettingsError,
  type ModelConfig,
  type EnabledModelConfig
} from "../types/settings";

export class SettingsService {
  private configFile: string;

  constructor(configFile: string = ".chararc") {
    this.configFile = configFile;
  }

  // Provider Management Methods

  /**
   * Get all configured providers
   */
  async getProviders(): Promise<SettingsProviderConfig[]> {
    try {
      if (!(await existsGlobalConfig(this.configFile))) {
        return [];
      }

      const config = await readGlobalConfig(this.configFile) as ExtendedGlobalSettings;
      const providers = config.providers || {};

      return Object.values(providers);
    } catch (error) {
      throw this.createError(
        SettingsErrorType.SETTINGS_SAVE_ERROR,
        'Failed to read providers from settings',
        undefined,
        error
      );
    }
  }

  /**
   * Create a new provider configuration
   */
  async createProvider(providerData: CreateProviderInput): Promise<SettingsProviderConfig> {
    try {
      // Validate provider type
      const providerConfig = PROVIDER_CONFIGS[providerData.type];
      if (!providerConfig) {
        throw this.createError(
          SettingsErrorType.VALIDATION_ERROR,
          `Unsupported provider type: ${providerData.type}`
        );
      }

      // Validate required fields
      const validationErrors = this.validateProviderConfiguration(providerData.type, providerData.configuration);
      if (validationErrors.length > 0) {
        throw this.createError(
          SettingsErrorType.VALIDATION_ERROR,
          'Provider configuration validation failed',
          undefined,
          validationErrors
        );
      }

      // Generate unique ID
      const id = `${providerData.type}_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      const now = new Date();

      // Generate name from provider type if not provided
      const providerTypeLabels: Record<string, string> = {
        'openai': 'OpenAI',
        'anthropic': 'Anthropic',
        'google': 'Google AI',
        'dial': 'DIAL',
        'openrouter': 'OpenRouter',
        'deepseek': 'DeepSeek',
        'moonshot': 'Moonshot',
        'gemini-cli': 'Gemini CLI',
        'ollama': 'Ollama',
        'lmstudio': 'LM Studio',
        'custom': 'Custom'
      };

      const provider: SettingsProviderConfig = {
        id,
        name: providerData.name || providerTypeLabels[providerData.type] || providerData.type,
        type: providerData.type,
        enabled: providerData.enabled,
        configuration: providerData.configuration,
        requiredFields: providerConfig.fields.filter(f => f.required).map(f => f.name),
        createdAt: now,
        updatedAt: now
      };

      // Save to global config
      const currentConfig = await this.getGlobalConfig();
      const providers = currentConfig.providers || {};
      providers[id] = provider;

      await updateGlobalConfig({
        providers
      }, this.configFile);

      return provider;
    } catch (error) {
      if (error instanceof Error && error.message.includes('validation')) {
        throw error;
      }
      throw this.createError(
        SettingsErrorType.SETTINGS_SAVE_ERROR,
        'Failed to create provider',
        undefined,
        error
      );
    }
  }

  /**
   * Update an existing provider
   */
  async updateProvider(id: string, updates: Partial<SettingsProviderConfig>): Promise<SettingsProviderConfig> {
    try {
      const currentConfig = await this.getGlobalConfig();
      const providers = currentConfig.providers || {};

      const existingProvider = providers[id];
      if (!existingProvider) {
        throw this.createError(
          SettingsErrorType.VALIDATION_ERROR,
          `Provider with id ${id} not found`
        );
      }

      // Validate configuration if being updated
      if (updates.configuration) {
        const validationErrors = this.validateProviderConfiguration(
          existingProvider.type,
          updates.configuration
        );
        if (validationErrors.length > 0) {
          throw this.createError(
            SettingsErrorType.VALIDATION_ERROR,
            'Provider configuration validation failed',
            undefined,
            validationErrors
          );
        }
      }

      // Update provider
      const updatedProvider: SettingsProviderConfig = {
        ...existingProvider,
        ...updates,
        id, // Ensure ID doesn't change
        updatedAt: new Date()
      };

      providers[id] = updatedProvider;

      await updateGlobalConfig({
        providers
      }, this.configFile);

      return updatedProvider;
    } catch (error) {
      if (error instanceof Error && error.message.includes('validation')) {
        throw error;
      }
      throw this.createError(
        SettingsErrorType.SETTINGS_SAVE_ERROR,
        'Failed to update provider',
        undefined,
        error
      );
    }
  }

  /**
   * Delete a provider and disable associated models
   */
  async deleteProvider(id: string): Promise<void> {
    try {
      const currentConfig = await this.getGlobalConfig();
      const providers = currentConfig.providers || {};

      const provider = providers[id];
      if (!provider) {
        throw this.createError(
          SettingsErrorType.VALIDATION_ERROR,
          `Provider with id ${id} not found`
        );
      }

      // Remove provider
      delete providers[id];

      // Disable models associated with this provider
      const enabledModelsConfig = currentConfig.models?.enabledModels || {};
      const providerPrefix = `${provider.type}:::`;

      // Get available models to find which ones belong to this provider
      let providerModelIds: string[] = [];
      try {
        const availableModels = await this.getAvailableModels();
        providerModelIds = availableModels
          .filter(model => model.provider === provider.type)
          .map(model => model.id);
      } catch (error) {
        // If we can't get available models, we'll just remove prefixed models
        console.warn('Could not get available models for provider cleanup:', error);
      }

      // Remove from enabledModels configuration
      const updatedEnabledModelsConfig = { ...enabledModelsConfig };
      Object.keys(updatedEnabledModelsConfig).forEach(modelId => {
        if (modelId.startsWith(providerPrefix) || providerModelIds.includes(modelId)) {
          delete updatedEnabledModelsConfig[modelId];
        }
      });

      await updateGlobalConfig({
        providers,
        models: {
          ...currentConfig.models,
          enabledModels: updatedEnabledModelsConfig
        }
      }, this.configFile);
    } catch (error) {
      if (error instanceof Error && error.message.includes('validation')) {
        throw error;
      }
      throw this.createError(
        SettingsErrorType.SETTINGS_SAVE_ERROR,
        'Failed to delete provider',
        undefined,
        error
      );
    }
  }

  /**
   * Get providers by type
   */
  async getProvidersByType(type: string): Promise<SettingsProviderConfig[]> {
    const providers = await this.getProviders();
    return providers.filter(provider => provider.type === type);
  }

  // Model Management Methods

  /**
   * Get available models from all configured providers
   */
  async getAvailableModels(provider?: string): Promise<ModelConfig[]> {
    try {
      // Try to fetch models from API endpoint first
      let allModels: Record<string, any[]> = {};

      try {
        // Construct API URL with optional provider filter
        const apiUrl = provider
          ? getAgentsApiUrl(`/api/models?all&provider=${encodeURIComponent(provider)}`)
          : getAgentsApiUrl('/api/models?all');

        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const modelsData = await response.json();

        // Convert the response format to match expected structure
        if (Array.isArray(modelsData)) {
          // If response is an array of models, group them by provider
          allModels = modelsData.reduce((acc: Record<string, any[]>, model: any) => {
            const modelProvider = model.provider || 'unknown';
            if (!acc[modelProvider]) {
              acc[modelProvider] = [];
            }
            acc[modelProvider].push(model);
            return acc;
          }, {});
        } else if (typeof modelsData === 'object') {
          // If response is already grouped by provider
          allModels = modelsData;
        }
      } catch (apiError) {
        // If API fails, get configured providers and return fallback data
        console.warn('Failed to fetch models from API, using fallback data:', apiError);

        const configuredProviders = await this.getProviders();
        const fallbackModels: ModelConfig[] = [];

        configuredProviders.forEach(configuredProvider => {
          if (configuredProvider.enabled && (!provider || configuredProvider.type === provider)) {
            // Add some basic models based on provider type
            const providerModels = this.getFallbackModelsForProvider(configuredProvider.type);
            fallbackModels.push(...providerModels);
          }
        });

        return fallbackModels;
      }

      const modelsList: ModelConfig[] = [];

      // Convert provider models to ModelConfig format
      Object.entries(allModels).forEach(([provider, models]) => {
        if (Array.isArray(models)) {
          models.forEach(model => {
            modelsList.push({
              id: model.id || `${provider}_${model.name}`,
              name: model.name || model.id,
              provider: provider,
              contextSize: model.contextLength || model.contextSize,
              hasTools: model.hasTools || false,
              recommended: model.recommended || false,
              approved: model.approved !== false // Default to true unless explicitly false
            });
          });
        }
      });

      return modelsList;
    } catch (error) {
      throw this.createError(
        SettingsErrorType.SETTINGS_SAVE_ERROR,
        'Failed to get available models from API',
        undefined,
        error
      );
    }
  }

  /**
   * Get fallback models for a provider type when registry is unavailable
   */
  private getFallbackModelsForProvider(providerType: string): ModelConfig[] {
    const fallbackModels: Record<string, ModelConfig[]> = {};

    return fallbackModels[providerType] || [];
  }

  /**
   * Get enabled models list
   */
  async getEnabledModels(): Promise<string[]> {
    try {
      const config = await this.getGlobalConfig();

      // Use only the new enabledModels structure
      return Object.keys(config.models?.enabledModels || {});
    } catch (error) {
      throw this.createError(
        SettingsErrorType.SETTINGS_SAVE_ERROR,
        'Failed to get enabled models',
        undefined,
        error
      );
    }
  }

  /**
   * Get enabled models with full configuration
   */
  async getEnabledModelsWithConfig(): Promise<Record<string, EnabledModelConfig>> {
    try {
      const config = await this.getGlobalConfig();
      return config.models?.enabledModels || {};
    } catch (error) {
      throw this.createError(
        SettingsErrorType.SETTINGS_SAVE_ERROR,
        'Failed to get enabled models configuration',
        undefined,
        error
      );
    }
  }

  /**
   * Enable a model with full configuration
   */
  async enableModel(modelId: string): Promise<void> {
    // Basic validation - ensure modelId is provided
    if (!modelId || typeof modelId !== 'string' || modelId.trim() === '') {
      throw this.createError(
        SettingsErrorType.VALIDATION_ERROR,
        'Model ID is required and must be a non-empty string'
      );
    }

    try {
      // Get current configuration
      const config = await this.getGlobalConfig();
      const enabledModelsConfig = config.models?.enabledModels || {};

      // If model is already enabled, don't add it again
      if (enabledModelsConfig[modelId]) {
        return;
      }

      // Get full model information from available models
      let modelConfig: ModelConfig | null = null;
      try {
        const availableModels = await this.getAvailableModels();

        // For prefixed IDs, extract the provider and model ID
        let provider: string;
        let actualModelId: string;

        if (modelId.includes(':::')) {
          [provider, actualModelId] = modelId.split(':::');
          modelConfig = availableModels.find(m => m.id === actualModelId && m.provider === provider) || null;
        } else {
          // For non-prefixed IDs, find the model (backward compatibility)
          modelConfig = availableModels.find(m => m.id === modelId) || null;
        }
      } catch (error) {
        console.warn('Could not fetch model details from providers:', error);
      }

      // Create enabled model configuration
      const now = new Date();
      const enabledModelConfig: EnabledModelConfig = {
        id: modelConfig?.id || (modelId.includes(':::') ? modelId.split(':::')[1] : modelId),
        name: modelConfig?.name || (modelId.includes(':::') ? modelId.split(':::')[1] : modelId),
        provider: modelConfig?.provider || (modelId.includes(':::') ? modelId.split(':::')[0] : 'unknown'),
        contextSize: modelConfig?.contextSize,
        hasTools: modelConfig?.hasTools || false,
        recommended: modelConfig?.recommended || false,
        approved: modelConfig?.approved !== false,
        enabledAt: now,
        updatedAt: now
      };

      // Add to enabledModels configuration
      enabledModelsConfig[modelId] = enabledModelConfig;

      await updateGlobalConfig({
        models: {
          ...config.models,
          enabledModels: enabledModelsConfig
        }
      }, this.configFile);
    } catch (error) {
      throw this.createError(
        SettingsErrorType.SETTINGS_SAVE_ERROR,
        'Failed to enable model',
        undefined,
        error
      );
    }
  }

  /**
   * Disable a model
   */
  async disableModel(modelId: string): Promise<void> {
    // Basic validation - ensure modelId is provided
    if (!modelId || typeof modelId !== 'string' || modelId.trim() === '') {
      throw this.createError(
        SettingsErrorType.VALIDATION_ERROR,
        'Model ID is required and must be a non-empty string'
      );
    }

    try {
      const config = await this.getGlobalConfig();
      const enabledModelsConfig = config.models?.enabledModels || {};

      // Remove from enabledModels configuration
      const updatedEnabledModelsConfig = { ...enabledModelsConfig };
      delete updatedEnabledModelsConfig[modelId];

      await updateGlobalConfig({
        models: {
          ...config.models,
          enabledModels: updatedEnabledModelsConfig
        }
      }, this.configFile);
    } catch (error) {
      throw this.createError(
        SettingsErrorType.SETTINGS_SAVE_ERROR,
        'Failed to disable model',
        undefined,
        error
      );
    }
  }

  /**
   * Get models by provider
   */
  async getModelsByProvider(provider: string): Promise<ModelConfig[]> {
    // Use the enhanced getAvailableModels method with provider filtering
    return await this.getAvailableModels(provider);
  }



  // Configuration Management Methods

  /**
   * Get global configuration
   */
  async getGlobalConfig(): Promise<ExtendedGlobalSettings> {
    try {
      if (!(await existsGlobalConfig(this.configFile))) {
        return {};
      }
      return await readGlobalConfig(this.configFile) as ExtendedGlobalSettings;
    } catch (error) {
      throw this.createError(
        SettingsErrorType.SETTINGS_SAVE_ERROR,
        'Failed to read global configuration',
        undefined,
        error
      );
    }
  }

  /**
   * Update global configuration
   */
  async updateGlobalConfig(config: Partial<ExtendedGlobalSettings>): Promise<void> {
    try {
      await updateGlobalConfig(config, this.configFile);
    } catch (error) {
      throw this.createError(
        SettingsErrorType.SETTINGS_SAVE_ERROR,
        'Failed to update global configuration',
        undefined,
        error
      );
    }
  }

  // Validation Methods

  /**
   * Validate provider configuration based on type
   */
  private validateProviderConfiguration(type: string, configuration: Record<string, any>): SettingsError[] {
    const errors: SettingsError[] = [];
    const providerConfig = PROVIDER_CONFIGS[type];

    if (!providerConfig) {
      errors.push(this.createError(
        SettingsErrorType.VALIDATION_ERROR,
        `Unknown provider type: ${type}`
      ));
      return errors;
    }

    // Check required fields
    for (const field of providerConfig.fields) {
      if (field.required && (!configuration[field.name] || configuration[field.name].trim() === '')) {
        errors.push(this.createError(
          SettingsErrorType.VALIDATION_ERROR,
          `${field.name} is required for ${type} provider`,
          field.name
        ));
      }

      // Validate field types
      if (configuration[field.name]) {
        const value = configuration[field.name];

        if (field.type === 'url') {
          try {
            new URL(value);
          } catch {
            errors.push(this.createError(
              SettingsErrorType.VALIDATION_ERROR,
              `${field.name} must be a valid URL`,
              field.name
            ));
          }
        }

        if (field.type === 'password' && type === 'openai' && !value.startsWith('sk-')) {
          errors.push(this.createError(
            SettingsErrorType.VALIDATION_ERROR,
            'OpenAI API key should start with sk-',
            field.name
          ));
        }

        if (field.type === 'password' && type === 'anthropic' && !value.startsWith('sk-ant-')) {
          errors.push(this.createError(
            SettingsErrorType.VALIDATION_ERROR,
            'Anthropic API key should start with sk-ant-',
            field.name
          ));
        }
      }
    }

    return errors;
  }

  /**
   * Create a standardized error object
   */
  private createError(
    type: SettingsErrorType,
    message: string,
    field?: string,
    details?: any
  ): SettingsError {
    return {
      type,
      message,
      field,
      details
    };
  }
}
