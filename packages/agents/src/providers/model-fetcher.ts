import { logger } from '@chara/logger';
import type { ModelInfo, OpenAIModelsResponse, OpenAIModel, OpenRouterModelsResponse, OpenRouterModel } from './types';

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
      logger.warning('Failed to fetch OpenAI models from API, using fallback models:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Fallback to known models if API fails
      return [
        { id: 'gpt-4o', name: 'GPT-4o' },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
      ];
    }
  }

  /**
   * Fetches available models from OpenRouter API
   * @returns Array of OpenRouter models or fallback models if API fails
   */
  export async function fetchOpenRouterModels(): Promise<ModelInfo[]> {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPEN_ROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as OpenRouterModelsResponse;
      return data.data.map((model: OpenRouterModel) => ({
        id: model.id,
        name: model.name,
        description: model.description,
        contextLength: model.context_length,
        created: model.created,
      }));
    } catch (error) {
      logger.warning('Failed to fetch OpenRouter models from API, using fallback models:', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Fallback to known popular models if API fails
      return [
        { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
        { id: 'openai/gpt-4o', name: 'GPT-4o' },
        { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini' },
        { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B Instruct' },
        { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5' },
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
    fetchFunction: () => Promise<ModelInfo[]>
  ): Promise<ModelInfo[]> {
    try {
      return await fetchFunction();
    } catch (error) {
      logger.error(`Failed to fetch models for ${providerName}:`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`Failed to fetch models for ${providerName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}