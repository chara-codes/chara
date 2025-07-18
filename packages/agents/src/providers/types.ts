import type { LanguageModelV1 } from "@ai-sdk/provider";

/**
 * Represents an error that occurred during provider initialization
 */
export interface InitializationError {
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
export interface OpenAIModel {
  id: string;
  created: number;
  owned_by: string;
}

export interface OpenAIModelsResponse {
  data: OpenAIModel[];
}

/**
 * OpenRouter API response types
 */
export interface OpenRouterModel {
  id: string;
  name: string;
  created: number;
  description?: string;
  architecture?: {
    input_modalities?: string[];
    output_modalities?: string[];
    tokenizer?: string;
  };
  top_provider?: {
    is_moderated?: boolean;
  };
  pricing?: {
    prompt?: string;
    completion?: string;
    image?: string;
    request?: string;
  };
  context_length?: number;
  supported_parameters?: string[];
}

export interface OpenRouterModelsResponse {
  data: OpenRouterModel[];
}

/**
 * Ollama API response types
 */
export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaModelsResponse {
  models: OllamaModel[];
}

/**
 * Anthropic API response types
 */
export interface AnthropicModel {
  id: string;
  type: string;
  display_name: string;
  created_at: string;
}

export interface AnthropicModelsResponse {
  data: AnthropicModel[];
}

/**
 * Google API response types
 */
export interface GoogleModel {
  name: string;
  baseModelId: string;
  version: string;
  displayName: string;
  description: string;
  inputTokenLimit: number;
  outputTokenLimit: number;
  supportedGenerationMethods: string[];
  temperature?: number;
  maxTemperature?: number;
  topP?: number;
  topK?: number;
}

export interface GoogleModelsResponse {
  models: GoogleModel[];
  nextPageToken?: string;
}

/**
 * DeepSeek API response types
 */
export interface DeepSeekModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export interface DeepSeekModelsResponse {
  object: string;
  data: DeepSeekModel[];
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
