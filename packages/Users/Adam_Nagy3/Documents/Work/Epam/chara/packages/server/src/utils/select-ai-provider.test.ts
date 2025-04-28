import { describe, it, expect } from 'vitest';
import { selectAIProvider } from './select-ai-provider';

describe('selectAIProvider', () => {
  it('should create OpenAI provider', () => {
    const config = {
      apiUrl: 'https://api.openai.com/v1',
      apiKey: 'test-key'
    };
    const provider = selectAIProvider(config);
    expect(provider).toBeDefined();
  });

  it('should create Azure provider', () => {
    const config = {
      apiUrl: 'https://myresource.azure.com/openai',
      apiKey: 'test-key'
    };
    const provider = selectAIProvider(config);
    expect(provider).toBeDefined();
  });

  it('should create Anthropic provider', () => {
    const config = {
      apiUrl: 'https://api.anthropic.com/v1',
      apiKey: 'test-key'
    };
    const provider = selectAIProvider(config);
    expect(provider).toBeDefined();
  });

  it('should create Cohere provider', () => {
    const config = {
      apiUrl: 'https://api.cohere.ai/v1',
      apiKey: 'test-key'
    };
    const provider = selectAIProvider(config);
    expect(provider).toBeDefined();
  });

  it('should create Perplexity provider', () => {
    const config = {
      apiUrl: 'https://api.perplexity.ai/v1',
      apiKey: 'test-key'
    };
    const provider = selectAIProvider(config);
    expect(provider).toBeDefined();
  });

  it('should create Mistral provider', () => {
    const config = {
      apiUrl: 'https://api.mistral.ai/v1',
      apiKey: 'test-key'
    };
    const provider = selectAIProvider(config);
    expect(provider).toBeDefined();
  });

  it('should create Deepseek provider', () => {
    const config = {
      apiUrl: 'https://api.deepseek.com/v1',
      apiKey: 'test-key'
    };
    const provider = selectAIProvider(config);
    expect(provider).toBeDefined();
  });

  it('should create Ollama provider', () => {
    const config = {
      apiUrl: 'http://localhost:11434/v1',
      apiKey: 'test-key'
    };
    const provider = selectAIProvider(config);
    expect(provider).toBeDefined();
  });

  it('should create DeepInfra provider', () => {
    const config = {
      apiUrl: 'https://api.deepinfra.com/v1',
      apiKey: 'test-key'
    };
    const provider = selectAIProvider(config);
    expect(provider).toBeDefined();
  });

  it('should throw error for unsupported provider', () => {
    const config = {
      apiUrl: 'https://api.unsupported.com/v1',
      apiKey: 'test-key'
    };
    expect(() => selectAIProvider(config)).toThrow('Unsupported AI provider for URL');
  });

  it('should handle config with only required parameters', () => {
    const config = {
      apiUrl: 'https://api.openai.com/v1',
      apiKey: 'test-key'
    };
    const provider = selectAIProvider(config);
    expect(provider).toBeDefined();
  });
});
