# Server Actions Documentation

This document describes the server actions available in the Chara CLI for starting and stopping the Chara server directly using the `@chara-codes/server` package.

## Overview

The server actions provide a way to programmatically start and stop the Chara server with configurable options. These actions complement the existing agent actions but work directly with the core server functionality.

## Actions

### `start-server`

Starts the Chara server with configurable options.

#### Options

```typescript
interface StartServerActionOptions extends ActionOptions {
  port?: number;                    // Port to start server on (default: 3030)
  host?: string;                    // Host to bind to (default: "localhost")
  mcpEnabled?: boolean;             // Enable Model Context Protocol (default: false)
  mcpTransport?: string;            // MCP transport type (default: "stdio")
  websocketEnabled?: boolean;       // Enable WebSocket support (default: false)
  websocketPath?: string;           // WebSocket path (default: "/ws")
  corsEnabled?: boolean;            // Enable CORS (default: true)
  corsOrigin?: string;              // CORS origin (default: "*")
  loggingEnabled?: boolean;         // Enable logging (default: true)
  silent?: boolean;                 // Suppress UI output (default: false)
}
```

#### Returns

```typescript
Promise<{ server: ServerManager; port: number }>
```

#### Example

```typescript
import { startServerAction } from '@chara-codes/cli/actions';

// Start server with default options
const { server, port } = await startServerAction({
  verbose: true
});

// Start server with custom configuration
const { server, port } = await startServerAction({
  port: 8080,
  host: "0.0.0.0",
  mcpEnabled: true,
  websocketEnabled: true,
  corsOrigin: "http://localhost:3000",
  verbose: true
});
```

### `stop-server`

Stops the Chara server and cleans up resources.

#### Options

```typescript
interface StopServerActionOptions extends ActionOptions {
  server?: any;                     // Server manager instance to stop
  silent?: boolean;                 // Suppress UI output (default: false)
  force?: boolean;                  // Force stop without graceful shutdown (default: false)
}
```

#### Returns

```typescript
Promise<void>
```

#### Example

```typescript
import { stopServerAction } from '@chara-codes/cli/actions';

// Graceful stop
await stopServerAction({
  server: serverManager,
  verbose: true
});

// Force stop
await stopServerAction({
  server: serverManager,
  force: true,
  verbose: true
});
```

## Usage Patterns

### Basic Server Lifecycle

```typescript
import { startServerAction, stopServerAction } from '@chara-codes/cli/actions';

// Start the server
const { server, port } = await startServerAction({
  port: 3030,
  mcpEnabled: true,
  websocketEnabled: true,
  verbose: true
});

console.log(`Server started on port ${port}`);

// ... do work ...

// Stop the server
await stopServerAction({
  server,
  verbose: true
});

console.log('Server stopped');
```

### Error Handling

```typescript
import { startServerAction, stopServerAction } from '@chara-codes/cli/actions';

try {
  const { server, port } = await startServerAction({
    port: 3030,
    verbose: true
  });
  
  // ... server work ...
  
} catch (error) {
  console.error('Failed to start server:', error);
} finally {
  // Always try to stop the server
  try {
    await stopServerAction({
      server,
      force: true, // Force stop in case of errors
      silent: true
    });
  } catch (stopError) {
    console.error('Failed to stop server:', stopError);
  }
}
```

### Using with Action Factory

```typescript
import { ActionFactory } from '@chara-codes/cli/actions';

// Server actions are automatically registered when the registry module is imported
// Use via factory
const { server, port } = await ActionFactory.execute('start-server', {
  port: 3030,
  mcpEnabled: true,
  verbose: true
});

// Stop via factory
await ActionFactory.execute('stop-server', {
  server,
  verbose: true
});
```

## Configuration Options

### Port Configuration

```typescript
// Default port
await startServerAction({}); // Uses port 3030

// Custom port
await startServerAction({ port: 8080 });

// High port number
await startServerAction({ port: 65535 });
```

### Host Configuration

```typescript
// Localhost only (default)
await startServerAction({ host: "localhost" });

// All interfaces
await startServerAction({ host: "0.0.0.0" });

// Specific IP
await startServerAction({ host: "192.168.1.100" });

// IPv6
await startServerAction({ host: "::1" });
```

### Feature Toggles

```typescript
// Enable all features
await startServerAction({
  mcpEnabled: true,
  websocketEnabled: true,
  corsEnabled: true,
  loggingEnabled: true
});

// Minimal server
await startServerAction({
  mcpEnabled: false,
  websocketEnabled: false,
  corsEnabled: false,
  loggingEnabled: false
});
```

### MCP Configuration

```typescript
// Enable MCP with default transport
await startServerAction({
  mcpEnabled: true
}); // Uses "stdio" transport

// Enable MCP with WebSocket transport
await startServerAction({
  mcpEnabled: true,
  mcpTransport: "websocket"
});
```

### WebSocket Configuration

```typescript
// Enable WebSocket with default path
await startServerAction({
  websocketEnabled: true
}); // Uses "/ws" path

// Enable WebSocket with custom path
await startServerAction({
  websocketEnabled: true,
  websocketPath: "/custom-websocket"
});
```

### CORS Configuration

```typescript
// Default CORS (allow all)
await startServerAction({
  corsEnabled: true
}); // Uses "*" origin

// Specific origin
await startServerAction({
  corsEnabled: true,
  corsOrigin: "http://localhost:3000"
});

// Multiple origins
await startServerAction({
  corsEnabled: true,
  corsOrigin: "http://localhost:3000,https://example.com"
});

// Disable CORS
await startServerAction({
  corsEnabled: false
});
```

## Differences from Agent Actions

| Feature | Server Actions | Agent Actions |
|---------|----------------|---------------|
| **Package** | `@chara-codes/server` | `@chara-codes/agents` |
| **Purpose** | Core server functionality | Agent-specific features |
| **Default Port** | 3030 | 3031 |
| **Registration** | Separate registry | Main registry |
| **Dependencies** | Minimal server deps | Full agent ecosystem |

## Error Scenarios

### Configuration Errors

```typescript
// Missing global config
try {
  await startServerAction({});
} catch (error) {
  // Error: "No configuration found. Run 'chara init' first..."
}
```

### Port Conflicts

```typescript
// Port already in use
try {
  await startServerAction({ port: 80 }); // Privileged port
} catch (error) {
  // Error: "Address already in use" or permission error
}
```

### Stop Errors

```typescript
// Server already stopped
await stopServerAction({
  server: null // Safe - will not throw
});

// Server with errors
await stopServerAction({
  server: corruptedServer,
  force: true // Force stop to avoid hanging
});
```

## Best Practices

### 1. Always Handle Cleanup

```typescript
let server;
try {
  const result = await startServerAction({ port: 3030 });
  server = result.server;
  // ... work ...
} finally {
  if (server) {
    await stopServerAction({ server, force: true });
  }
}
```

### 2. Use Silent Mode for Programmatic Usage

```typescript
// In automated scripts
const { server, port } = await startServerAction({
  port: 3030,
  silent: true,  // No UI output
  verbose: false // No debug logs
});
```

### 3. Configure Based on Environment

```typescript
const isDevelopment = process.env.NODE_ENV === 'development';

await startServerAction({
  port: isDevelopment ? 3030 : 8080,
  host: isDevelopment ? "localhost" : "0.0.0.0",
  corsEnabled: isDevelopment,
  verbose: isDevelopment
});
```

### 4. Graceful Shutdown

```typescript
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  await stopServerAction({
    server,
    force: false, // Try graceful first
    verbose: true
  });
  process.exit(0);
});
```

## Troubleshooting

### Server Won't Start

1. Check if configuration exists: `chara init`
2. Verify port is available: `lsof -i :3030`
3. Check permissions for port binding
4. Review logs with `verbose: true`

### Server Won't Stop

1. Try force stop: `force: true`
2. Check for hanging connections
3. Verify server instance is valid
4. Use process signals as fallback

### Memory Issues

1. Ensure proper cleanup with `stopServerAction`
2. Avoid creating multiple server instances
3. Monitor resource usage in production

## Integration with CLI Commands

The server actions can be integrated into CLI commands:

```typescript
// In a command file
export const serverCommand: CommandModule = {
  command: 'server',
  describe: 'Manage Chara server',
  builder: (yargs) => 
    yargs
      .option('port', { type: 'number', default: 3030 })
      .option('start', { type: 'boolean', default: false })
      .option('stop', { type: 'boolean', default: false }),
  handler: async (argv) => {
    if (argv.start) {
      await ActionFactory.execute('start-server', {
        port: argv.port,
        verbose: argv.verbose
      });
    }
    if (argv.stop) {
      await ActionFactory.execute('stop-server', {
        server: globalServerInstance,
        verbose: argv.verbose
      });
    }
  }
};
```

## Testing

The server actions include comprehensive unit tests:

```bash
# Run server action tests
bun test src/actions/__tests__/server-actions-unit.test.ts

# Run all action tests
bun test src/actions/__tests__/
```

The tests cover:
- Type definitions and interfaces
- Options validation
- Error handling scenarios
- Integration readiness
- Configuration combinations
- Compatibility with base ActionOptions

## Future Enhancements

Planned improvements for server actions:

1. **Health Checks**: Built-in health check endpoints
2. **Metrics**: Server metrics and monitoring
3. **Clustering**: Multi-instance support
4. **SSL/TLS**: HTTPS configuration options
5. **Rate Limiting**: Built-in rate limiting
6. **Authentication**: Server authentication options

## See Also

- [Actions Pattern Documentation](./README.md)
- [Main Action Registry](./registry.ts)
- [Server Package Documentation](../../server/README.md)
- [Agent Actions](./start-agents.ts)
- [Action Factory](./factory.ts)