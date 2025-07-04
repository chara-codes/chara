// Export all types
export type {
  InitializationError,
  ModelInfo,
  OpenAIModel,
  OpenAIModelsResponse,
  DeepSeekModel,
  DeepSeekModelsResponse,
  ProviderConfig,
} from "./types";

// Export main registry class
export { ProvidersRegistry } from "./registry";

// Export utility classes (in case they're needed)
export { BaseProviderInitializer } from "./base-initializer";
export { ModelFetcher } from "./model-fetcher";
export { ProviderConfigs } from "./provider-configs";

// Create and export a singleton instance
import { ProvidersRegistry } from "./registry";
export const providersRegistry = new ProvidersRegistry();

/**
 * Convenience functions for accessing the singleton registry
 */

/** Get a provider configuration by name */
export const getProvider = async (name: string) =>
  await providersRegistry.getProvider(name);

/** Get all available providers */
export const getAvailableProviders = async () =>
  await providersRegistry.getAvailableProviders();

/** Get a model instance from a provider */
export const getModel = async (providerName: string, modelName: string) =>
  await providersRegistry.getModel(providerName, modelName);

/** Check if a provider is available */
export const hasProvider = async (name: string) =>
  await providersRegistry.hasProvider(name);

/** Fetch available models for a specific provider */
export const fetchModels = async (providerName: string) =>
  await providersRegistry.fetchModels(providerName);

/** Fetch available models for all providers */
export const fetchAllModels = async () =>
  await providersRegistry.fetchAllModels();
