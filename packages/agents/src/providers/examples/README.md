# Provider Examples

This directory contains examples of how to create custom providers using the new provider architecture.

## Custom Provider Example

The `custom-provider.ts` file demonstrates how to create a custom provider by extending the `AbstractProvider` class.

### Key Features Demonstrated

1. **Environment Variable Handling**: Shows how to use `getEnvVar()` to fetch API keys and base URLs
2. **Validation**: Demonstrates custom validation logic in `canInitialize()` and `validateConfig()`
3. **Provider Factory**: Shows how to create a provider factory function that returns AI SDK compatible models
4. **Model Fetching**: Implements custom model fetching from a provider's API
5. **Health Checks**: Custom health check implementation
6. **Error Handling**: Proper error handling and logging

### Usage

```typescript
import { providersRegistry } from '../providers';
import { customProvider } from './custom-provider';

// Register the custom provider
providersRegistry.registerProvider('custom', customProvider);

// Initialize providers
await providersRegistry.initialize();

// Use the custom provider
if (await providersRegistry.hasProvider('custom')) {
  const model = await providersRegistry.getModel('custom', 'gpt-4');
  // Use the model...
}
```

### Environment Variables

The custom provider example uses:
- `CUSTOM_API_KEY`: API key for authentication
- `CUSTOM_BASE_URL`: Base URL for the API (optional, has default)

## Creating Your Own Provider

To create a new provider:

1. **Extend AbstractProvider**: Create a class that extends `AbstractProvider`
2. **Define Required Properties**: Set `key`, `name`, `requiresApiKey`, etc.
3. **Implement Required Methods**:
   - `canInitialize()`: Check if provider can be initialized
   - `createProvider()`: Create the provider factory function
   - `fetchModels()`: Fetch available models
4. **Optional Methods**:
   - `healthCheck()`: Custom health check logic
   - `validateConfig()`: Custom configuration validation
5. **Register the Provider**: Use `providersRegistry.registerProvider()` to add it

### Template

```typescript
import { AbstractProvider, getEnvVar, validateApiKey } from "../providers/base-provider";

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
    const apiKey = await getEnvVar(this.apiKeyEnvVar!);
    
    if (!apiKey) {
      throw new Error(`${this.name} API key is required`);
    }

    // Create your provider instance here
    const provider = createMyProvider({ apiKey });
    return (modelId: string) => provider(modelId);
  }

  public async fetchModels(): Promise<ModelInfo[]> {
    // Implement model fetching logic
    return [];
  }
}

export const myProvider = new MyProvider();
```

## Best Practices

1. **Always validate configuration**: Check API keys, URLs, and other required settings
2. **Handle errors gracefully**: Use try-catch blocks and provide meaningful error messages
3. **Use proper logging**: Log important events and errors for debugging
4. **Implement health checks**: Provide a way to verify the provider is working correctly
5. **Support environment variables**: Use `getEnvVar()` to support both env vars and global config
6. **Follow naming conventions**: Use consistent naming for environment variables and provider keys
7. **Document your provider**: Add clear comments and documentation

## Testing Your Provider

Create tests for your custom provider:

```typescript
import { describe, test, expect } from "bun:test";
import { MyProvider } from "./my-provider";

describe("MyProvider", () => {
  test("should initialize with valid API key", async () => {
    process.env.MY_PROVIDER_API_KEY = "test-key";
    
    const provider = new MyProvider();
    const canInit = await provider.canInitialize();
    
    expect(canInit).toBe(true);
  });

  test("should fail without API key", async () => {
    delete process.env.MY_PROVIDER_API_KEY;
    
    const provider = new MyProvider();
    const canInit = await provider.canInitialize();
    
    expect(canInit).toBe(false);
  });
});
```

## Integration with Registry

Once you've created your provider, register it with the main registry:

```typescript
import { providersRegistry } from "../providers";
import { myProvider } from "./my-provider";

// Register the provider
providersRegistry.registerProvider("myprovider", myProvider);

// Now it can be used like any built-in provider
await providersRegistry.initialize();
const model = await providersRegistry.getModel("myprovider", "model-name");
```

The provider will be available through all the standard registry methods:
- `getProvider()`
- `hasProvider()`
- `getModel()`
- `fetchModels()`
- `getAvailableProviders()`
