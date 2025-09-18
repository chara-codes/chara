# Providers Module

This module contains the refactored AI providers registry system, broken down into smaller, more manageable files for better maintainability and testing.

## Structure

```
providers/
├── README.md              # This file
├── index.ts              # Main exports and singleton instance
├── types.ts              # TypeScript interfaces and types
├── base-initializer.ts   # Base class with common utilities
├── provider-configs.ts   # Provider configuration management
├── model-fetcher.ts      # Model fetching utilities
├── registry.ts           # Main ProvidersRegistry class
└── providers/            # Individual provider implementations
    ├── index.ts          # Provider exports
    ├── base-provider.ts  # Base provider interface and utilities
    ├── openai.ts         # OpenAI provider
    ├── anthropic.ts      # Anthropic provider
    ├── google.ts         # Google provider
    ├── deepseek.ts       # DeepSeek provider
    ├── openrouter.ts     # OpenRouter provider
    ├── ollama.ts         # Ollama provider
    ├── lmstudio.ts       # LMStudio provider
    ├── dial.ts           # DIAL provider
    ├── moonshot.ts       # Moonshot provider
    └── gemini-cli.ts     # Gemini CLI provider
```

## Files Overview

### `types.ts`
Contains all TypeScript interfaces and types:
- `InitializationError` - Error tracking during provider setup
- `ModelInfo` - Model metadata structure
- `OpenAIModel` and `OpenAIModelsResponse` - OpenAI API types
- `ProviderConfig` - Provider configuration interface

### `base-initializer.ts`
Base class providing common functionality:
- API key validation
- Provider status logging
- Safe initialization wrapper
- Error tracking

### `provider-configs.ts`
Provider configuration management:
- Uses the new provider structure from `providers/` directory
- Maintains backward compatibility with legacy initialization methods
- Supports custom provider registration
- Handles provider caching and lazy initialization

### `model-fetcher.ts`
Utilities for fetching models from providers:
- OpenAI models fetching with fallback
- Generic model fetching wrapper
- Error handling and logging

### `registry.ts`
Main `ProvidersRegistry` class:
- Orchestrates provider initialization
- Provides public API methods
- Manages provider lifecycle

### `index.ts`
Main entry point:
- Exports all types and classes
- Creates singleton instance
- Provides convenience functions

## Usage

The API remains the same as before. Import from the main providers-registry file or directly from the providers module:

```typescript
// Old way (still works)
import { providersRegistry, getModel } from './providers-registry';

// New way (preferred for new code)
import { providersRegistry, getModel } from './providers';

// Get a model
const gpt4 = getModel('openai', 'gpt-4o');

// Check available providers
const providers = providersRegistry.getAvailableProviders();
```

### `providers/` Directory
Individual provider implementations:
- **`base-provider.ts`**: Base interface and abstract class for all providers
- **`openai.ts`**: OpenAI provider implementation
- **`anthropic.ts`**: Anthropic provider implementation
- **`google.ts`**: Google provider implementation
- **`deepseek.ts`**: DeepSeek provider implementation
- **`openrouter.ts`**: OpenRouter provider implementation
- **`ollama.ts`**: Ollama provider implementation
- **`lmstudio.ts`**: LMStudio provider implementation
- **`dial.ts`**: DIAL provider implementation
- **`moonshot.ts`**: Moonshot provider implementation
- **`gemini-cli.ts`**: Gemini CLI provider implementation
- **`index.ts`**: Exports all providers and utilities

Each provider file contains:
- Provider class implementation
- Configuration validation
- Model fetching capabilities
- Health check functionality
- Singleton instance export

## Benefits of Refactoring

1. **Better Organization**: Each provider is in its own file
2. **Easier Testing**: Individual providers can be tested in isolation
3. **Improved Maintainability**: Smaller, focused files are easier to understand and modify
4. **Better Reusability**: Provider classes can be extended or customized
5. **Cleaner Separation**: Each provider handles its own configuration and logic
6. **Enhanced Extensibility**: Easy to add new providers by implementing BaseProvider interface
7. **Consistent Interface**: All providers follow the same pattern

## Adding New Providers

To add a new provider, create a new file in the `providers/` directory:

```typescript
// providers/my-provider.ts
import { AbstractProvider, getEnvVar, validateApiKey } from "./base-provider";

export class MyProvider extends AbstractProvider {
  readonly key = "myprovider";
  readonly name = "My Provider";
  readonly requiresApiKey = true;
  readonly apiKeyEnvVar = "MY_PROVIDER_API_KEY";

  public async canInitialize(): Promise<boolean> {
    const apiKey = await getEnvVar(this.apiKeyEnvVar!);
    return validateApiKey(apiKey, this.name);
  }

  public async createProvider(): Promise<(modelId: string) => LanguageModelV1> {
    // Implementation here
  }

  public async fetchModels(): Promise<ModelInfo[]> {
    // Implementation here
  }
}

export const myProvider = new MyProvider();
```

Then register it in the main registry:

```typescript
import { providersRegistry } from './providers';
import { myProvider } from './providers/my-provider';

providersRegistry.registerProvider('myprovider', myProvider);
```

## Backward Compatibility

All existing imports continue to work without changes. The legacy initialization methods in `ProviderConfigs` are maintained for backward compatibility.

## Refactoring Complete

The providers module has been successfully refactored with the following improvements:

### ✅ Completed Features

1. **Individual Provider Files**: Each provider now has its own dedicated file in `providers/` directory
2. **Consistent Interface**: All providers implement the `BaseProvider` interface
3. **Better Organization**: Clear separation of concerns with focused, single-responsibility files
4. **Enhanced Extensibility**: Easy to add new providers by extending `AbstractProvider`
5. **Improved Testing**: Individual providers can be tested in isolation
6. **Backward Compatibility**: All existing code continues to work without changes
7. **Custom Provider Support**: Full support for registering custom providers
8. **Environment Variable Support**: All providers support both env vars and global config
9. **Health Checks**: Built-in health check capabilities for all providers
10. **Comprehensive Documentation**: Complete documentation with examples

### 🏗️ Architecture

The new architecture provides:
- **Modular Design**: Each provider is self-contained
- **Consistent API**: All providers follow the same pattern
- **Flexible Configuration**: Support for various configuration methods
- **Error Handling**: Robust error handling and logging
- **Performance**: Lazy loading and caching for better performance

### 📁 File Structure

```
providers/
├── providers/               # Individual provider implementations
│   ├── base-provider.ts    # Base interface and utilities
│   ├── openai.ts          # OpenAI provider
│   ├── anthropic.ts       # Anthropic provider
│   ├── google.ts          # Google provider
│   ├── deepseek.ts        # DeepSeek provider
│   ├── openrouter.ts      # OpenRouter provider
│   ├── ollama.ts          # Ollama provider
│   ├── lmstudio.ts        # LMStudio provider
│   ├── dial.ts            # DIAL provider
│   ├── moonshot.ts        # Moonshot provider
│   ├── gemini-cli.ts      # Gemini CLI provider
│   └── index.ts           # Provider registry and exports
├── examples/               # Custom provider examples
│   ├── custom-provider.ts # Example custom provider
│   └── README.md          # Provider development guide
├── __tests__/             # Test files
└── [other core files]     # Registry, types, etc.
```

### 🚀 Benefits Achieved

1. **Maintainability**: Smaller, focused files are easier to understand and modify
2. **Scalability**: Easy to add new providers without modifying existing code
3. **Testing**: Individual components can be tested in isolation
4. **Documentation**: Each provider is self-documenting with clear interfaces
5. **Extensibility**: Plugin-like architecture for custom providers
6. **Reliability**: Better error handling and validation
7. **Performance**: Optimized initialization and caching

The refactoring maintains full backward compatibility while providing a much cleaner, more maintainable, and extensible architecture for the future.