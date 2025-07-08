# Global Configuration Integration

The Chara agents package now supports global configuration as a fallback when environment variables are not provided. This allows you to store your API keys and configuration settings in a global config file instead of relying solely on environment variables.

## How It Works

The provider configuration system follows this priority order:

1. **Environment Variables** (highest priority)
2. **Global Configuration File** (fallback)
3. **No configuration** (provider unavailable)

## Configuration File Location

The global configuration file is stored at `~/.chararc` (in your home directory) and uses JSON format.

## Setting Up Global Configuration

### Using the @chara-codes/settings Package

You can programmatically manage the global configuration:

```typescript
import { writeGlobalConfig, readGlobalConfig, updateGlobalConfig } from '@chara-codes/settings';

// Create initial configuration
await writeGlobalConfig({
  env: {
    OPENAI_API_KEY: "sk-your-openai-key-here",
    ANTHROPIC_API_KEY: "sk-ant-your-anthropic-key-here",
    GOOGLE_GENERATIVE_AI_API_KEY: "your-google-api-key-here",
    DEEPSEEK_API_KEY: "your-deepseek-api-key-here",
    OPEN_ROUTER_API_KEY: "your-openrouter-api-key-here",
    OLLAMA_API_BASE_URL: "http://localhost:11434",
    LMSTUDIO_API_BASE_URL: "http://localhost:1234/v1",
    DIAL_API_KEY: "your-dial-api-key-here",
    DIAL_API_BASE_URL: "http://localhost:8080"
  },
  defaultModel: "deepseek:::deepseek-chat",
  debug: true,
  autoCommit: false
});

// Read existing configuration
const config = await readGlobalConfig();

// Update configuration (merges with existing)
await updateGlobalConfig({
  env: {
    OPENAI_API_KEY: "sk-new-openai-key-here"
  },
});
```

### Manual Configuration

You can also manually create or edit the `~/.chararc` file:

```json
{
  "env": {
    "OPENAI_API_KEY": "sk-your-openai-key-here",
    "ANTHROPIC_API_KEY": "sk-ant-your-anthropic-key-here",
    "GOOGLE_GENERATIVE_AI_API_KEY": "your-google-api-key-here",
    "DEEPSEEK_API_KEY": "your-deepseek-api-key-here",
    "OPEN_ROUTER_API_KEY": "your-openrouter-api-key-here",
    "OLLAMA_API_BASE_URL": "http://localhost:11434",
    "LMSTUDIO_API_BASE_URL": "http://localhost:1234/v1",
    "DIAL_API_KEY": "your-dial-api-key-here",
    "DIAL_API_BASE_URL": "http://localhost:8080"
  },
  "defaultModel": "deepseek:::deepseek-chat",
  "debug": true,
  "autoCommit": false
}
```

## Supported Environment Variables

The following environment variables can be stored in the global configuration:

### API Keys
- `OPENAI_API_KEY`: OpenAI API key
- `ANTHROPIC_API_KEY`: Anthropic API key
- `GOOGLE_GENERATIVE_AI_API_KEY`: Google Generative AI API key
- `DEEPSEEK_API_KEY`: DeepSeek API key
- `OPEN_ROUTER_API_KEY`: OpenRouter API key
- `DIAL_API_KEY`: DIAL API key

### Base URLs
- `OLLAMA_API_BASE_URL`: Ollama server URL (e.g., `http://localhost:11434`)
- `LMSTUDIO_API_BASE_URL`: LMStudio server URL (e.g., `http://localhost:1234/v1`)
- `DIAL_API_BASE_URL`: DIAL server URL (e.g., `http://localhost:8080`)

## Configuration Priority Example

Given this setup:

**Environment Variables:**
```bash
export OPENAI_API_KEY="env-openai-key"
```

**Global Config (~/.chararc):**
```json
{
  "env": {
    "OPENAI_API_KEY": "global-openai-key",
    "ANTHROPIC_API_KEY": "global-anthropic-key"
  }
}
```

**Result:**
- OpenAI provider will use `"env-openai-key"` (environment variable takes priority)
- Anthropic provider will use `"global-anthropic-key"` (fallback to global config)
- Other providers will be unavailable (no configuration found)

## Benefits

1. **Centralized Configuration**: Store all your API keys in one place
2. **Environment Flexibility**: Switch between development and production environments easily
3. **Fallback Safety**: Providers work even if environment variables are missing
4. **Version Control Safe**: Keep sensitive data out of your project files
5. **Cross-Platform**: Works consistently across different operating systems

## Security Considerations

- The global config file is stored in your home directory
- File permissions should be set appropriately (readable only by you)
- Consider using environment variables for production deployments
- Never commit the global config file to version control

## Troubleshooting

### Config Not Found
If you see warnings about missing configuration, check:
1. Environment variables are set correctly
2. Global config file exists at `~/.chararc`
3. Global config file has valid JSON format
4. The `env` section contains the required keys

### Provider Still Unavailable
If a provider is still unavailable after configuration:
1. Verify the API key format is correct
2. Check for typos in environment variable names
3. Ensure base URLs are valid and accessible
4. Review the provider's specific requirements

### Debugging
Enable debug logging to see which configuration source is being used:

```typescript
import { logger } from '@chara-codes/logger';

// This will show "Using global config for {provider} {setting}" messages
logger.setLevel('debug');
```

## Example Usage

```typescript
import { providersRegistry } from '@chara-codes/agents';

// This will now work even if environment variables are not set,
// as long as the global config contains the necessary API keys
const openaiProvider = await providersRegistry.getProvider('openai');
const anthropicProvider = await providersRegistry.getProvider('anthropic');

if (openaiProvider) {
  const model = await providersRegistry.getModel('openai', 'gpt-4o');
  // Use the model...
}
```

This integration makes it much easier to manage your AI provider configurations across different projects and environments while maintaining security and flexibility.
