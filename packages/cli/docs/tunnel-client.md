# Tunnel Client Action

The tunnel client action provides programmatic access to create and manage tunnel client connections, allowing you to expose local development servers to the internet through the Chara tunnel infrastructure.

## Overview

The tunnel client action consists of two main functions:
- `startTunnelClientAction`: Creates and connects a tunnel client
- `stopTunnelClientAction`: Disconnects and cleans up a tunnel client

## Usage

### Starting a Tunnel Client

```typescript
import { startTunnelClientAction } from '@chara-codes/cli/actions';

// Basic usage with defaults
const { client, subdomain } = await startTunnelClientAction({
  port: 3000,
  host: 'localhost',
  remoteHost: 'tunnel.chara-ai.dev',
  verbose: true
});

console.log(`Your app is available at: https://${subdomain}`);
```

### Stopping a Tunnel Client

```typescript
import { stopTunnelClientAction } from '@chara-codes/cli/actions';

await stopTunnelClientAction({
  client,
  silent: false,
  force: false
});
```

## API Reference

### `startTunnelClientAction(options)`

Creates and connects a tunnel client to expose a local server to the internet.

#### Parameters

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `port` | `number` | `3000` | Local port to forward |
| `host` | `string` | `"localhost"` | Local host to forward |
| `remoteHost` | `string` | `"tunnel.chara-ai.dev"` | Remote tunnel server host |
| `secure` | `boolean` | `true` | Use secure WebSocket connection (wss://) |
| `subdomain` | `string` | `undefined` | Desired subdomain (random if not specified) |
| `silent` | `boolean` | `false` | Suppress UI output for programmatic use |
| `verbose` | `boolean` | `false` | Enable detailed logging |

#### Returns

```typescript
Promise<{
  client: TunnelClient;
  port: number;
  host: string;
  remoteHost: string;
  subdomain?: string;
}>
```

#### Example

```typescript
const result = await startTunnelClientAction({
  port: 8080,
  host: '127.0.0.1',
  remoteHost: 'tunnel.example.com',
  subdomain: 'my-app',
  secure: true,
  verbose: true
});

console.log('Tunnel URL:', `https://${result.subdomain}`);
```

### `stopTunnelClientAction(options)`

Disconnects and cleans up a tunnel client connection.

#### Parameters

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `client` | `TunnelClient` | `undefined` | Client instance to stop |
| `silent` | `boolean` | `false` | Suppress UI output |
| `verbose` | `boolean` | `false` | Enable detailed logging |
| `force` | `boolean` | `false` | Force disconnect without graceful shutdown |

#### Returns

`Promise<void>`

#### Example

```typescript
await stopTunnelClientAction({
  client: tunnelClient,
  silent: false,
  force: false
});
```

## Events

The tunnel client emits various events that you can listen to:

```typescript
const { client } = await startTunnelClientAction({ port: 3000 });

client.on('open', () => {
  console.log('Connection established');
});

client.on('subdomain_assigned', (data) => {
  console.log('Assigned subdomain:', data.subdomain);
});

client.on('http_request', (message) => {
  console.log('HTTP request:', message.method, message.path);
});

client.on('error', (error) => {
  console.error('Connection error:', error);
});

client.on('close', (data) => {
  console.log('Connection closed:', data.code, data.reason);
});
```

## Error Handling

The action includes comprehensive error handling:

```typescript
try {
  const result = await startTunnelClientAction({
    port: 3000,
    remoteHost: 'tunnel.chara-ai.dev'
  });
  
  // Use the tunnel...
  
} catch (error) {
  if (error.message.includes('Connection timeout')) {
    console.error('Failed to connect to tunnel server');
  } else if (error.message.includes('Connection closed')) {
    console.error('Connection was closed unexpectedly');
  } else {
    console.error('Unknown error:', error);
  }
}
```

## Integration with Other Actions

The tunnel client action can be combined with other Chara actions:

```typescript
import { 
  startTunnelClientAction, 
  startServerAction,
  ActionFactory 
} from '@chara-codes/cli/actions';

// Start a local server
const { server } = await startServerAction({
  port: 3000,
  silent: true
});

// Expose it through a tunnel
const { client, subdomain } = await startTunnelClientAction({
  port: 3000,
  silent: true
});

console.log(`Server available at: https://${subdomain}`);

// Clean up
await stopTunnelClientAction({ client, silent: true });
```

## Configuration

### Environment Variables

The action respects the following environment variables:

- `CHARA_TUNNEL_HOST`: Default remote host
- `CHARA_TUNNEL_SECURE`: Default secure setting
- `CHARA_LOG_LEVEL`: Logging level

### Programmatic Configuration

```typescript
const config = {
  port: process.env.PORT || 3000,
  host: process.env.HOST || 'localhost',
  remoteHost: process.env.CHARA_TUNNEL_HOST || 'tunnel.chara-ai.dev',
  secure: process.env.CHARA_TUNNEL_SECURE !== 'false',
  verbose: process.env.NODE_ENV === 'development'
};

const result = await startTunnelClientAction(config);
```

## Best Practices

1. **Always handle errors**: Tunnel connections can fail for various reasons
2. **Use timeouts**: Don't wait indefinitely for connections
3. **Clean up resources**: Always call `stopTunnelClientAction` when done
4. **Use silent mode**: In production or automated environments
5. **Monitor connections**: Listen to events to detect connection issues

```typescript
// Good practice example
let tunnelClient;

try {
  const result = await startTunnelClientAction({
    port: 3000,
    silent: process.env.NODE_ENV === 'production',
    verbose: process.env.NODE_ENV === 'development'
  });
  
  tunnelClient = result.client;
  
  // Set up cleanup on process exit
  process.on('SIGINT', async () => {
    if (tunnelClient) {
      await stopTunnelClientAction({ 
        client: tunnelClient, 
        silent: true 
      });
    }
    process.exit(0);
  });
  
} catch (error) {
  console.error('Failed to start tunnel:', error);
  process.exit(1);
}
```

## Troubleshooting

### Common Issues

1. **Connection Timeout**: Check if the tunnel server is running and accessible
2. **Port Already in Use**: Ensure the local port is available
3. **Network Issues**: Verify internet connectivity and firewall settings
4. **SSL/TLS Issues**: Check if secure connections are properly configured

### Debug Mode

Enable verbose logging to troubleshoot issues:

```typescript
const result = await startTunnelClientAction({
  port: 3000,
  verbose: true,
  silent: false
});
```

This will provide detailed logs about the connection process and any errors encountered.