# @chara/settings

A comprehensive utility package for managing different types of settings in the Chara CLI ecosystem, including global configuration and environment management.

## Features

- **Environment Management**: Cross-platform environment variable handling
- **Global Configuration**: Read, write, update, and manage global configuration files
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
console.log(environment.publicUrl); // SERVER_URL environment variable
console.log(environment.apiUrl);    // API_URL environment variable
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
  getPathToGlobalConfig
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
  publicUrl: string;  // SERVER_URL environment variable
  apiUrl: string;     // API_URL environment variable
  homeDir: string;    // User's home directory
}
```

### Global Configuration Functions

- `getPathToGlobalConfig(file?: string)`: Get full path to configuration file
- `readGlobalConfig(file?: string)`: Read and parse configuration file
- `writeGlobalConfig(config: any, file?: string)`: Write configuration to file
- `updateGlobalConfig(config: any, file?: string)`: Merge updates with existing config
- `existsGlobalConfig(file?: string)`: Check if configuration file exists
- `removeGlobalConfig(file?: string)`: Delete configuration file

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

---

This project is part of the Chara CLI ecosystem and uses [Bun](https://bun.sh) as the runtime and package manager.