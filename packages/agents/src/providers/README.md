# Providers Module

This module contains the refactored AI providers registry system, broken down into smaller, more manageable files for better maintainability and testing.

## Structure

```
providers/
├── README.md              # This file
├── index.ts              # Main exports and singleton instance
├── types.ts              # TypeScript interfaces and types
├── base-initializer.ts   # Base class with common utilities
├── provider-configs.ts   # Individual provider configurations
├── model-fetcher.ts      # Model fetching utilities
└── registry.ts           # Main ProvidersRegistry class
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
Individual provider initialization functions:
- OpenAI, Anthropic, Google, Mistral, Groq
- OpenRouter, Ollama, xAI, AWS Bedrock
- HuggingFace (placeholder)
- Each provider has its own initialization method

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

## Benefits of Refactoring

1. **Better Organization**: Each concern is in its own file
2. **Easier Testing**: Individual components can be tested in isolation
3. **Improved Maintainability**: Smaller files are easier to understand and modify
4. **Better Reusability**: Utility classes can be reused
5. **Cleaner Separation**: Types, utilities, and business logic are separated

## Backward Compatibility

The original `providers-registry.ts` file still exists and re-exports everything from this module, ensuring all existing imports continue to work without changes.