# Server Refactor Documentation

## Overview

The `startServer` function has been refactored to provide more granular control over server initialization. You can now selectively enable/disable MCP initialization, WebSocket functionality, and runner service.

## New Features

### 1. Configurable Services

The server now supports fine-grained control over its components:

- **MCP (Model Context Protocol)**: Can be enabled/disabled and configured for sync/async initialization
- **WebSocket**: Can be enabled/disabled with custom endpoint configuration
- **Runner Service**: Can be enabled/disabled with custom commands and working directories

### 2. Server Instance Management

The `startServer` function now returns a `ServerInstance` object with lifecycle management methods:

- `server`: Access to the underlying Bun server
- `stop()`: Graceful shutdown of all services
- `restart(services?)`: Restart specific services without full server restart

### 3. Enhanced Configuration Options

```typescript
interface StartServerOptions {
  charaConfigFile?: string;
  port?: number;
  logLevel?: LogLevel;
  mcp?: {
    enabled?: boolean;
    initializeSync?: boolean;
  };
  websocket?: {
    enabled?: boolean;
    endpoint?: string;
  };
  runner?: {
    enabled?: boolean;
    command?: string;
    cwd?: string;
  };
}
```

## Usage Examples

### Basic Usage (Default Configuration)

```typescript
import { startServer } from '@chara-codes/agents';

// Start server with all default settings
const serverInstance = await startServer();

// Later, stop the server
await serverInstance.stop();
```

### Custom Configuration

```typescript
import { startServer, LogLevel } from '@chara-codes/agents';

const serverInstance = await startServer({
  port: 8080,
  logLevel: LogLevel.DEBUG,
  mcp: {
    enabled: true,
    initializeSync: true, // Wait for MCP to initialize before starting
  },
  websocket: {
    enabled: true,
    endpoint: '/api/ws', // Custom WebSocket endpoint
  },
  runner: {
    enabled: true,
    command: 'npm run dev', // Custom development command
    cwd: '/path/to/project', // Custom working directory
  },
});
```

### Minimal Configuration (API-only server)

```typescript
import { startServer } from '@chara-codes/agents';

// Start server with only API endpoints, no WebSocket or runner
const serverInstance = await startServer({
  websocket: { enabled: false },
  runner: { enabled: false },
  mcp: { enabled: false },
});
```

### Development Server with Custom Runner

```typescript
import { startServer } from '@chara-codes/agents';

const serverInstance = await startServer({
  runner: {
    enabled: true,
    command: 'vite --port 3000',
    cwd: './frontend',
  },
});
```

## Server Management

### Graceful Shutdown

```typescript
const serverInstance = await startServer();

// Handle shutdown signals
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await serverInstance.stop();
  process.exit(0);
});
```

### Service Restart

```typescript
const serverInstance = await startServer();

// Restart only the runner service
await serverInstance.restart(['runner']);

// Restart both MCP and runner services
await serverInstance.restart(['mcp', 'runner']);

// Restart all services (default)
await serverInstance.restart();
```

## Configuration Validation

The server validates configuration options and throws descriptive errors for invalid settings:

- Port must be between 1 and 65535
- WebSocket endpoint must start with '/'
- Runner working directory must exist

## Backwards Compatibility

The refactored `startServer` function maintains full backwards compatibility. Existing code will continue to work without modifications:

```typescript
// This still works exactly as before
const server = await startServer();
```

## Benefits

1. **Flexibility**: Enable only the services you need
2. **Performance**: Avoid initializing unused services
3. **Testing**: Easier to test individual components
4. **Deployment**: Different configurations for different environments
5. **Resource Management**: Better control over resource usage

## Migration Guide

### From Previous Version

If you were using the old `startServer` function, no changes are required. However, you can now take advantage of the new configuration options:

```typescript
// Old way (still works)
const server = await startServer({ port: 3000 });

// New way (with more control)
const serverInstance = await startServer({
  port: 3000,
  mcp: { enabled: false }, // Disable MCP if not needed
  websocket: { enabled: false }, // Disable WebSocket if not needed
});
```

### Environment-Specific Configurations

```typescript
// Development
const devServer = await startServer({
  logLevel: LogLevel.DEBUG,
  mcp: { enabled: true, initializeSync: false },
  websocket: { enabled: true },
  runner: { enabled: true },
});

// Production
const prodServer = await startServer({
  logLevel: LogLevel.INFO,
  mcp: { enabled: true, initializeSync: true },
  websocket: { enabled: true },
  runner: { enabled: false }, // No development server in production
});

// Testing
const testServer = await startServer({
  port: 0, // Random available port
  logLevel: LogLevel.ERROR,
  mcp: { enabled: false },
  websocket: { enabled: false },
  runner: { enabled: false },
});
```

## Error Handling

The refactored server provides better error handling and logging:

```typescript
try {
  const serverInstance = await startServer({
    runner: { 
      enabled: true,
      command: 'invalid-command',
    },
  });
} catch (error) {
  console.error('Failed to start server:', error);
  // Server will continue running with other services
}
```

## Troubleshooting

### Common Issues

1. **MCP Initialization Fails**: Server continues with local tools only
2. **Runner Service Fails**: WebSocket and API still work
3. **WebSocket Disabled**: API endpoints still function normally
4. **Port Already in Use**: Server throws error during startup

### Debug Logging

Enable debug logging to see detailed startup information:

```typescript
const serverInstance = await startServer({
  logLevel: LogLevel.DEBUG,
});
```

This will show detailed logs for each service initialization step.