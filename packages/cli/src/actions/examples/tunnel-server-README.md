# Tunnel Server Action

The tunnel server action provides programmatic access to the Chara Tunnel server functionality, allowing you to start and stop tunnel servers that expose local development servers to the internet.

## Overview

The tunnel server action consists of two main functions:
- `startTunnelServerAction`: Start a tunnel server with configurable options
- `stopTunnelServerAction`: Stop a running tunnel server

## Usage

### Starting a Tunnel Server

```typescript
import { ActionFactory } from "../registry";
import type { StartTunnelServerActionOptions } from "../types";

// Basic tunnel server
const result = await ActionFactory.execute<StartTunnelServerActionOptions>(
  "start-tunnel-server",
  {
    port: 1337,
    domain: "myapp.dev",
    controlDomain: "tunnel.myapp.dev",
    verbose: true,
  }
);

console.log(`Tunnel server started on port ${result.port}`);
console.log(`Domain: ${result.domain}`);
console.log(`Control Domain: ${result.controlDomain}`);
```

### Stopping a Tunnel Server

```typescript
import { ActionFactory } from "../registry";
import type { StopTunnelServerActionOptions } from "../types";

await ActionFactory.execute<StopTunnelServerActionOptions>(
  "stop-tunnel-server",
  {
    server: result.server,
    verbose: true,
  }
);
```

## Configuration Options

### StartTunnelServerActionOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `port` | `number` | `1337` | Port to start tunnel server on |
| `domain` | `string` | `"chara-ai.dev"` | Root domain for generating subdomains |
| `controlDomain` | `string` | `"tunnel.chara-ai.dev"` | Control domain for WebSocket connections |
| `configFile` | `string` | - | Path to JSON configuration file for content replacements |
| `replacements` | `TextReplacement[]` | `[]` | Array of text replacements to apply to responses |
| `silent` | `boolean` | `false` | Suppress UI output for programmatic use |
| `verbose` | `boolean` | `false` | Enable detailed logging |

### StopTunnelServerActionOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `server` | `Server` | - | Server instance to stop |
| `silent` | `boolean` | `false` | Suppress UI output |
| `verbose` | `boolean` | `false` | Enable detailed logging |
| `force` | `boolean` | `false` | Force stop without graceful shutdown |

### TextReplacement

| Property | Type | Description |
|----------|------|-------------|
| `pattern` | `string \| RegExp` | Pattern to match in response content |
| `replacement` | `string` | Replacement text (supports regex capture groups) |

## Examples

### Basic Tunnel Server

```typescript
const { server, port, domain, controlDomain } = await ActionFactory.execute(
  "start-tunnel-server",
  {
    port: 1337,
    domain: "example.dev",
    controlDomain: "tunnel.example.dev",
  }
);

// Server is now running and ready to accept connections
```

### Tunnel Server with Content Replacements

```typescript
const result = await ActionFactory.execute("start-tunnel-server", {
  port: 1338,
  domain: "dev.myproject.com",
  controlDomain: "tunnel.dev.myproject.com",
  replacements: [
    {
      pattern: "</body>",
      replacement: `
        <script>
          console.log('🔧 Development mode active');
          window.__DEV__ = true;
        </script>
        </body>
      `,
    },
    {
      pattern: /<title>(.*?)<\/title>/,
      replacement: "<title>$1 [DEV]</title>",
    },
    {
      pattern: "</head>",
      replacement: `
        <style>
          body::before {
            content: "DEV MODE";
            position: fixed;
            top: 0;
            right: 0;
            background: #ff6b6b;
            color: white;
            padding: 5px 10px;
            font-size: 12px;
            z-index: 9999;
          }
        </style>
        </head>
      `,
    },
  ],
});
```

### Tunnel Server with Config File

```typescript
// Create config file: tunnel-config.json
const configContent = {
  replacements: [
    {
      pattern: "</body>",
      replacement: "<script>console.log('Loaded from config');</script></body>",
    },
    {
      pattern: /<title>(.*?)<\/title>/,
      replacement: "<title>🔧 $1 [Tunnel]</title>",
    },
  ],
};

// Start server with config file
const result = await ActionFactory.execute("start-tunnel-server", {
  port: 1339,
  configFile: "./tunnel-config.json",
  verbose: true,
});
```

### Multiple Tunnel Servers

```typescript
const servers = [];

// Development server
const devServer = await ActionFactory.execute("start-tunnel-server", {
  port: 1340,
  domain: "dev.myproject.com",
  controlDomain: "dev-tunnel.myproject.com",
  replacements: [
    {
      pattern: "</head>",
      replacement: '<meta name="environment" content="development"></head>',
    },
  ],
  silent: true,
});
servers.push(devServer.server);

// Staging server
const stagingServer = await ActionFactory.execute("start-tunnel-server", {
  port: 1341,
  domain: "staging.myproject.com",
  controlDomain: "staging-tunnel.myproject.com",
  replacements: [
    {
      pattern: "</head>",
      replacement: '<meta name="environment" content="staging"></head>',
    },
  ],
  silent: true,
});
servers.push(stagingServer.server);

// Cleanup function
const cleanup = async () => {
  for (const server of servers) {
    await ActionFactory.execute("stop-tunnel-server", {
      server,
      silent: true,
    });
  }
};
```

### Graceful Shutdown

```typescript
let server: any = null;

const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}, shutting down gracefully...`);

  if (server) {
    try {
      await ActionFactory.execute("stop-tunnel-server", {
        server,
        force: false, // Graceful shutdown
        verbose: true,
      });
    } catch (error) {
      // Force stop if graceful shutdown fails
      await ActionFactory.execute("stop-tunnel-server", {
        server,
        force: true,
        silent: true,
      });
    }
  }
  process.exit(0);
};

// Register signal handlers
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Start server
const result = await ActionFactory.execute("start-tunnel-server", {
  port: 1342,
  domain: "graceful.dev",
  controlDomain: "tunnel.graceful.dev",
  verbose: true,
});

server = result.server;
```

## How It Works

1. **Server Creation**: The action creates a tunnel server using the Chara Tunnel package
2. **Configuration**: Applies the provided configuration including domain settings and replacements
3. **Content Modification**: If replacements are configured, the server modifies HTTP responses on-the-fly
4. **WebSocket Control**: Uses a control domain for WebSocket connections between clients and server
5. **Subdomain Routing**: Routes traffic from `*.domain` to connected clients

## Client Connection

Once a tunnel server is running, clients can connect using:

```bash
tunnel client --port 3000 --host localhost --remoteHost control.example.dev
```

Or programmatically:

```typescript
import { TunnelClient } from '@chara-codes/tunnel';

const client = new TunnelClient({
  port: 3000,
  host: 'localhost',
  remoteHost: 'control.example.dev',
  subdomain: 'myapp.example.dev'
});

await client.connect();
```

## Use Cases

- **Development Servers**: Expose local development servers to the internet
- **Webhook Testing**: Test webhook integrations with external services
- **Demo Environments**: Share work with clients or team members
- **Mobile Testing**: Test APIs with mobile applications over the internet
- **Content Injection**: Add development tools, analytics, or debugging scripts

## Error Handling

The action includes comprehensive error handling:

```typescript
try {
  const result = await ActionFactory.execute("start-tunnel-server", {
    port: 1337,
    configFile: "./non-existent-config.json",
  });
} catch (error) {
  console.error("Failed to start tunnel server:", error.message);
  // Handle error appropriately
}
```

Common errors:
- **Configuration file not found**: When `configFile` path doesn't exist
- **Invalid JSON**: When config file contains malformed JSON
- **Port in use**: When the specified port is already occupied
- **Permission denied**: When trying to bind to privileged ports without permissions

## Security Considerations

- **Domain Control**: Ensure you control the domains you configure
- **Content Replacement**: Be careful with replacement patterns to avoid security vulnerabilities
- **Access Control**: Consider implementing authentication for production use
- **HTTPS**: Use secure connections for sensitive data

## Performance Tips

- **Replacement Efficiency**: Use specific patterns instead of broad regex for better performance
- **Connection Limits**: Monitor the number of concurrent connections
- **Resource Cleanup**: Always stop servers when no longer needed
- **Logging Levels**: Use appropriate logging levels to avoid performance impact

## Troubleshooting

### Server Won't Start
- Check if the port is already in use
- Verify domain configuration
- Check file permissions for config files

### Clients Can't Connect
- Verify control domain DNS resolution
- Check firewall settings
- Ensure server is running and accessible

### Content Replacements Not Working
- Verify replacement patterns are correct
- Check content-type headers
- Test patterns with simple content first

### Performance Issues
- Reduce the number of replacement patterns
- Use more specific patterns
- Monitor server resources