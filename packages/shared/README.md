# @chara-codes/shared

Shared utilities and types for Chara Codes packages.

## Overview

This package contains common utilities that are used across multiple Chara Codes packages. The main purpose is to avoid code duplication and provide consistent implementations of shared functionality.

## Features

### NodeFS - @netlify/build-info FileSystem Implementation

The `NodeFS` class provides a complete Node.js implementation of the `FileSystem` interface required by `@netlify/build-info`. This allows the build-info library to analyze projects in Node.js environments.

## Installation

```bash
bun add @chara-codes/shared
```

## Usage

### NodeFS

```typescript
import { NodeFS } from "@chara-codes/shared";
import { Project } from "@netlify/build-info";

// Create a NodeFS instance
const fs = new NodeFS();

// Use with @netlify/build-info
const project = new Project(fs, process.cwd())
  .setEnvironment(process.env)
  .setNodeVersion(process.version);

// Get build settings
const buildSettings = await project.getBuildSettings();
const devCommand = buildSettings[0]?.devCommand;

// Detect frameworks
const frameworks = await project.detectFrameworks();

// Detect package manager
const packageManager = await project.detectPackageManager();
```

### Direct File Operations

```typescript
import { NodeFS } from "@chara-codes/shared";

const fs = new NodeFS();

// Check if file exists
const exists = await fs.fileExists("package.json");

// Read file content
const content = await fs.readFile("package.json");

// Write file content
await fs.writeFile("output.txt", "Hello, World!");

// List directory contents
const files = await fs.readDir("src");

// List directory with file types
const entries = await fs.readDir("src", true);
// Returns: { "file.ts": "file", "components": "directory" }
```

## API Reference

### NodeFS Class

#### Methods

##### Path Operations
- `isAbsolute(path: string): boolean` - Check if path is absolute
- `dirname(path: string): string` - Get directory name
- `basename(path: string): string` - Get base name
- `resolve(...paths: string[]): string` - Resolve paths
- `relative(from: string, to: string): string` - Get relative path
- `join(...segments: string[]): string` - Join path segments

##### File Operations
- `fileExists(path: string): Promise<boolean>` - Check if file exists
- `readFile(path: string): Promise<string>` - Read file content as UTF-8
- `writeFile(path: string, data: string): Promise<void>` - Write file content
- `stat(path: string): Promise<Stats>` - Get file/directory stats

##### Directory Operations
- `readdir(path: string): Promise<string[]>` - Read directory entries
- `readDir(path: string): Promise<string[]>` - Read directory entries (alias)
- `readDir(path: string, withFileTypes: true): Promise<Record<string, "directory" | "file">>` - Read directory with file types

##### Environment
- `getEnvironment(): "node"` - Get environment type
- `cwd: string` - Current working directory

## Error Handling

The NodeFS class handles errors gracefully:

- `fileExists()` returns `false` for non-existent files instead of throwing
- `readDir()` returns empty array `[]` or empty object `{}` for non-existent directories
- Other methods throw appropriate errors that can be caught and handled

## Testing

The package includes comprehensive tests for all NodeFS functionality:

```bash
bun test
```

Tests cover:
- Path operations and resolution
- File and directory operations
- Error handling scenarios
- Integration with real filesystem
- Edge cases and permissions

## Used By

This package is used by:
- `@chara-codes/agents` - For project analysis and build detection
- `@chara-codes/cli` - For development environment initialization

## Implementation Details

### Why NodeFS?

The `@netlify/build-info` library requires a `FileSystem` implementation to work in different environments. By providing a Node.js-specific implementation, we enable:

1. **Automatic Framework Detection** - Detect React, Vue, Next.js, etc.
2. **Build Command Detection** - Find dev, build, and test scripts
3. **Package Manager Detection** - Identify npm, yarn, pnpm, bun
4. **Workspace Support** - Handle monorepos and workspaces

### Design Principles

- **Type Safety** - Full TypeScript support with proper type definitions
- **Error Resilience** - Graceful handling of filesystem errors
- **Performance** - Efficient file operations with proper async/await
- **Consistency** - Uniform behavior across different use cases

## Contributing

When adding new shared utilities:

1. Add comprehensive tests
2. Update this README
3. Follow the existing code style
4. Ensure backward compatibility

## License

MIT