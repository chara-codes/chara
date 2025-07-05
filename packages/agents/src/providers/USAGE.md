# Providers Usage Guide

This guide demonstrates how to use the providers module with the unified initialization approach.

## Quick Start

```typescript
import { initialize, getModel } from '@chara/agents';

// Step 1: Initialize (required before any provider usage)
await initialize();

// Step 2: Use any available provider
const model = await getModel('openai', 'gpt-4o');

// Step 3: When settings change, simply call initialize() again
process.env.ANTHROPIC_API_KEY = 'new-key';
await initialize(); // Automatically handles reinitialization

// Step 4: Use updated providers
const claudeModel = await getModel('anthropic', 'claude-3-5-sonnet-20241022');
```

## Basic Usage

### 1. Initialize Providers

Before using any providers, you must explicitly initialize them:

```typescript
import { initialize, getModel, hasProvider } from '@chara/agents';

// Initialize providers first (required!)
await initialize();

// Now you can use providers
const model = await getModel('openai', 'gpt-4o');
```

### 2. Check Available Providers

```typescript
import { initialize, getAvailableProviders, hasProvider } from '@chara/agents';

await initialize();

// Get all available providers
const providers = await getAvailableProviders();
console.log('Available providers:', providers.map(p => p.name));

// Check if a specific provider is available
if (await hasProvider('openai')) {
  console.log('OpenAI is available!');
}
```

### 3. Fetch Available Models

```typescript
import { initialize, fetchModels, fetchAllModels } from '@chara/agents';

await initialize();

// Fetch models for a specific provider
const openaiModels = await fetchModels('openai');
console.log('OpenAI models:', openaiModels);

// Fetch models for all providers
const allModels = await fetchAllModels();
console.log('All provider models:', allModels);
```

## Reinitialization

### When to Reinitialize

Call `initialize()` again when:
- Environment variables change
- Configuration files are updated
- API keys are rotated
- New providers are configured

### How to Reinitialize

```typescript
import { initialize, getAvailableProviders } from '@chara/agents';

// Initial setup
await initialize();
let providers = await getAvailableProviders();
console.log('Before:', providers.length, 'providers');

// Update environment or configuration
process.env.ANTHROPIC_API_KEY = 'new-api-key';

// Simply call initialize() again - it handles reinitialization automatically
await initialize();

// After: potentially more providers
providers = await getAvailableProviders();
console.log('After:', providers.length, 'providers');
```

## Complete Example

```typescript
import { 
  initialize, 
  getModel, 
  getAvailableProviders,
  hasProvider 
} from '@chara/agents';

async function exampleUsage() {
  try {
    // Step 1: Initialize providers
    console.log('Initializing providers...');
    await initialize();
    
    // Step 2: Check what's available
    const providers = await getAvailableProviders();
    console.log(`Found ${providers.length} available providers:`, 
      providers.map(p => p.name).join(', '));
    
    // Step 3: Use a model if available
    if (await hasProvider('openai')) {
      const model = await getModel('openai', 'gpt-4o');
      console.log('OpenAI model ready:', model);
    }
    
    // Step 4: Simulate configuration change
    console.log('\nSimulating configuration update...');
    process.env.DEEPSEEK_API_KEY = 'new-deepseek-key';
    
    // Step 5: Call initialize() again - it automatically handles reinitialization
    await initialize();
    
    // Step 6: Check for new providers
    const updatedProviders = await getAvailableProviders();
    console.log(`After reinit: ${updatedProviders.length} providers available`);
    
    if (await hasProvider('deepseek')) {
      const deepseekModel = await getModel('deepseek', 'deepseek-chat');
      console.log('DeepSeek model ready:', deepseekModel);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the example
exampleUsage();
```

## Error Handling

### Uninitialized Access

```typescript
import { getModel } from '@chara/agents';

try {
  // This will throw an error!
  const model = await getModel('openai', 'gpt-4o');
} catch (error) {
  console.error(error.message); 
  // "Providers not initialized. Call initialize() first."
}
```

### Provider Not Available

```typescript
import { initialize, getModel } from '@chara/agents';

await initialize();

try {
  // This will throw if the provider isn't configured
  const model = await getModel('nonexistent', 'some-model');
} catch (error) {
  console.error(error.message); 
  // "Provider nonexistent is not available"
}
```

### Safe Provider Access

```typescript
import { initialize, hasProvider, getModel } from '@chara/agents';

await initialize();

// Safe approach
if (await hasProvider('openai')) {
  const model = await getModel('openai', 'gpt-4o');
  // Use model safely
} else {
  console.log('OpenAI not configured');
}
```

## Direct Registry Access

For advanced use cases, you can access the registry directly:

```typescript
import { providersRegistry } from '@chara/agents';

// Initialize
await providersRegistry.initialize();

// Get provider status
const status = await providersRegistry.getProviderStatus();
console.log('Provider status:', status);

// Get initialization errors
const errors = providersRegistry.getInitializationErrors();
if (errors.length > 0) {
  console.log('Initialization errors:', errors);
}

// Reinitialize
await providersRegistry.initialize();
```

## Server Integration

When using with the Chara server, providers are automatically initialized:

```typescript
import { startServer } from '@chara/agents';

// Server automatically initializes providers
const server = await startServer({
  port: 3031,
  mcp: { enabled: true },
  websocket: { enabled: true }
});

// Providers are now ready to use
```

## Best Practices

1. **Always initialize first**: Never use providers without calling `initialize()` first
2. **Handle errors gracefully**: Check if providers are available before using them
3. **Reinitialize when needed**: Call `initialize()` again when configuration changes - it's smart enough to handle both first-time setup and reinitialization
4. **Use await**: All provider methods are async and must be awaited
5. **Check availability**: Use `hasProvider()` to verify a provider is configured before using it
6. **One method for all**: There's only one `initialize()` method - use it for both initial setup and reinitialization

## Environment Variables

Supported environment variables for providers:

- `OPENAI_API_KEY`: OpenAI provider
- `ANTHROPIC_API_KEY`: Anthropic provider  
- `GOOGLE_GENERATIVE_AI_API_KEY`: Google provider
- `DEEPSEEK_API_KEY`: DeepSeek provider
- `OPEN_ROUTER_API_KEY`: OpenRouter provider
- `OLLAMA_API_BASE_URL`: Ollama provider (default: http://localhost:11434)
- `LMSTUDIO_API_BASE_URL`: LMStudio provider (default: http://localhost:1234/v1)
- `DIAL_API_KEY` + `DIAL_API_BASE_URL`: DIAL provider

Set these environment variables or add them to your global configuration before initializing providers.