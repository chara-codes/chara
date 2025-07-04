# @chara/settings

A comprehensive utility package for managing different types of settings in the Chara CLI ecosystem, including global configuration and environment management.

## Features

- **Environment Management**: Cross-platform environment variable handling
- **Global Configuration**: Read, write, update, and manage global configuration files
- **Models Whitelist Management**: Manage AI models whitelist with default curated models and custom user additions
- **Home Directory Detection**: Automatic detection of user home directories across platforms
- **Configuration Lifecycle**: Complete CRUD operations for configuration files
- **Type Safety**: Full TypeScript support with proper type definitions

## Installation

```bash
bun install @chara/settings
```

## Usage

### Environment Utilities

The `env` utility provides a consistent interface for accessing environment variables and system information:

```typescript
import { env } from "@chara/settings";

const environment = env();
console.log(environment.homeDir);   // User's home directory (cross-platform)
```

### Global Configuration Management

The global configuration utilities provide a complete set of functions for managing configuration files:

```typescript
import {
  readGlobalConfig,
  writeGlobalConfig,
  updateGlobalConfig,
  existsGlobalConfig,
  removeGlobalConfig,
  getPathToGlobalConfig,
  getVarFromEnvOrGlobalConfig
} from "@chara/settings";

// Check if config exists
const configExists = await existsGlobalConfig();

// Write new configuration
await writeGlobalConfig({
  projectName: "my-app",
  version: "1.0.0",
  settings: {
    debug: true,
    port: 3000
  }
});

// Read existing configuration
const config = await readGlobalConfig();

// Update configuration (merges with existing)
await updateGlobalConfig({
  version: "1.1.0",
  settings: {
    debug: false,
    newFeature: true
  }
});

// Get path to config file
const configPath = getPathToGlobalConfig();

// Remove configuration
await removeGlobalConfig();

// Get variable from environment or global config `env` field
const param = getVarFromEnvOrGlobalConfig('VAR_NAME')
```

### Models Whitelist Management

The models utilities provide comprehensive management for AI models whitelist:

```typescript
import {
  getModelsWhitelist,
  setModelsWhitelist,
  addCustomModel,
  removeCustomModel,
  getCustomModels,
  getRecommendedModels,
  getApprovedModels,
  getModelsByProvider,
  getModelsWithTools,
  findModelById,
  isModelWhitelisted,
  resetModelsWhitelist,
  DEFAULT_MODELS_WHITELIST,
  ModelConfig
} from "@chara/settings";

// Get current models whitelist (default + custom)
const models = await getModelsWhitelist();

// Add a custom model
await addCustomModel({
  id: "custom-model-id",
  name: "My Custom Model",
  provider: "custom-provider",
  contextSize: 128000,
  hasTools: true,
  recommended: true,
  approved: true
});

// Get only custom models
const customModels = await getCustomModels();

// Get recommended models
const recommendedModels = await getRecommendedModels();

// Get models by provider
const googleModels = await getModelsByProvider("google");

// Get models with tool support
const modelsWithTools = await getModelsWithTools();

// Find specific model
const model = await findModelById("gpt-4o");

// Check if model is whitelisted
const isWhitelisted = await isModelWhitelisted("claude-3-5-sonnet-20241022");

// Set custom whitelist (replaces default)
await setModelsWhitelist(customModels);

// Reset to default whitelist
await resetModelsWhitelist();

// Remove custom model
await removeCustomModel("custom-model-id");
```

### Custom Configuration Files

All configuration functions support custom file names:

```typescript
// Use custom config file
await writeGlobalConfig(config, ".my-custom-config");
await readGlobalConfig(".my-custom-config");
await updateGlobalConfig(updates, ".my-custom-config");
```

## API Reference

### Environment Interface

```typescript
interface Env {
  homeDir: string;    // User's home directory
}
```

### Model Configuration Interface

```typescript
interface ModelConfig {
  id: string;           // Unique model identifier
  name: string;         // Human-readable model name
  provider: string;     // Model provider (google, openai, anthropic, etc.)
  contextSize: number;  // Maximum context window size
  hasTools: boolean;    // Whether model supports tool calling
  recommended: boolean; // Whether model is recommended for general use
  approved: boolean;    // Whether model is approved for use
}
```

### Global Configuration Functions

- `getPathToGlobalConfig(file?: string)`: Get full path to configuration file
- `readGlobalConfig(file?: string)`: Read and parse configuration file
- `writeGlobalConfig(config: any, file?: string)`: Write configuration to file
- `updateGlobalConfig(config: any, file?: string)`: Merge updates with existing config
- `existsGlobalConfig(file?: string)`: Check if configuration file exists
- `removeGlobalConfig(file?: string)`: Delete configuration file
- `getVarFromEnvOrGlobalConfig(name: string)`: Get variable from environment or global config `env` field

### Models Management Functions

- `getModelsWhitelist()`: Get current models whitelist (default + custom)
- `setModelsWhitelist(models: ModelConfig[])`: Set custom models whitelist
- `addCustomModel(model: ModelConfig)`: Add or update custom model
- `removeCustomModel(modelId: string)`: Remove custom model
- `getCustomModels()`: Get only user-added custom models
- `resetModelsWhitelist()`: Reset to default whitelist and clear custom models
- `getRecommendedModels()`: Get only recommended models
- `getApprovedModels()`: Get only approved models
- `getModelsByProvider(provider: string)`: Get models by specific provider
- `getModelsWithTools()`: Get models that support tool calling
- `findModelById(modelId: string)`: Find specific model by ID
- `isModelWhitelisted(modelId: string)`: Check if model is in whitelist

## Default Configuration

- **Default config file**: `.chararc`
- **Location**: User's home directory
- **Format**: JSON with pretty-printing (2-space indentation)
- **Cross-platform**: Supports Windows (`USERPROFILE`) and Unix-like systems (`HOME`)

## Testing

Run the test suite:

```bash
bun test
```

The package includes comprehensive tests covering:
- Configuration file lifecycle management
- Models whitelist management and operations
- Custom models addition and removal
- Model filtering and querying functions
- Error handling for missing files
- Cross-platform compatibility
- JSON serialization/deserialization
- Configuration merging behavior

## Development

```bash
# Install dependencies
bun install

# Build the package
bun run build

# Run tests
bun test

# Development mode with watch
bun run dev
```

## Type Safety

This package is built with TypeScript and provides full type definitions. All functions are properly typed, and the package supports both CommonJS and ES modules.

## Changes Summary

### Version 0.1.0 - Models Whitelist Management

This release adds comprehensive AI models whitelist management functionality to the @chara/settings package:

#### New Features
- **Default Models Whitelist**: Curated list of 35+ high-quality AI models from major providers
- **Custom Models Support**: Add, update, and remove custom models in user configuration
- **Smart Filtering**: Filter models by provider, tool support, recommendation status, and approval
- **Whitelist Management**: Complete CRUD operations for models whitelist
- **Type Safety**: Full TypeScript support with `ModelConfig` interface

#### Supported Providers
- Google (Gemini 2.5 Pro/Flash, various versions)
- Anthropic (Claude 4, Claude 3.7/3.5 Sonnet, Haiku)
- OpenAI (GPT-4.1, GPT-4o variants)
- OpenRouter (proxy for multiple providers)
- Mistral (Large, Codestral, Nemo)
- DeepSeek (Chat, Reasoner)
- DIAL (enterprise gateway)

#### Key Benefits
- **Curated Quality**: Default whitelist includes only approved, high-quality models
- **Extensible**: Users can add custom models while keeping defaults
- **Flexible**: Filter by any combination of provider, tools, recommendation status
- **Persistent**: Configuration stored in global settings file
- **Type-Safe**: Full TypeScript definitions and compile-time checking

---

This project is part of the Chara CLI ecosystem and uses [Bun](https://bun.sh) as the runtime and package manager.
