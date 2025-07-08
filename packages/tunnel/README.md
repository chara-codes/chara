# Chara Tunnel

Chara Tunnel is a lightweight, easy-to-use tunneling service that exposes your local development servers to the internet through custom subdomains. Similar to tools like ngrok or localtunnel, Chara Tunnel allows you to share your work, test webhooks, and demo applications without deploying.

## Features

- 🌐 Expose local servers to the internet with custom subdomains
- 🔄 Stream HTTP requests and responses
- 🧩 Modify response content on-the-fly via configurable replacements
- 🔒 WebSocket-based secure communication
- 🔍 Detailed logging for troubleshooting

## Installation

```bash
# Install globally
bun add -g @chara-codes/tunnel

# Or use with bunx
bunx @chara-codes/tunnel [command]

# Or install locally
bun add @chara-codes/tunnel
```

## Usage

Chara Tunnel consists of two parts: a server component that receives internet traffic and a client component that connects to the server and forwards requests to your local application.


### Start a tunnel server

```bash
tunnel server --port 1337 --domain chara-ai.dev --controlDomain control.chara-ai.dev
```

### Connect a local server

```bash
tunnel client --port 3000 --host localhost --remoteHost control.chara-ai.dev --subdomain myapp.chara-ai.dev
```

This will make your local server available at `myapp.chara-ai.dev`.

### Using a random domain

If you don't specify a subdomain when connecting a client, the server will generate a random one for you:

```bash
tunnel client --port 3000 --host localhost --remoteHost control.chara-ai.dev
```

You'll receive output similar to:
```
✓ Connected to tunnel server!
✓ Tunnel established! Your local server is now available at:
  https://random-words-123456.chara-ai.dev
```

## Command Options

### Server Command

```bash
tunnel server [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `--port`, `-p` | Port to listen on | `1337` |
| `--domain` | Root domain for generating subdomains | `chara-ai.dev` |
| `--controlDomain` | Control domain for WebSocket connections | `control.chara-ai.dev` |
| `--debug`, `-D` | Enable debug logging | `false` |
| `--configFile`, `-c` | Path to a JSON configuration file for replacements | - |

### Client Command

```bash
tunnel client [options]
```

| Option | Description | Default |
|--------|-------------|---------|
| `--port`, `-p` | Local port to forward | `3000` |
| `--host`, `-h` | Local host to forward | `localhost` |
| `--remoteHost`, `-r` | Remote tunnel server host | `control.localhost:1337` |
| `--secure`, `-s` | Use secure WebSocket connection (wss://) | `true` |
| `--subdomain`, `-d` | Desired subdomain (random if not specified) | - |
| `--debug`, `-D` | Enable debug logging | `false` |

## Content Replacements

Chara Tunnel can modify HTML responses on-the-fly by applying text replacements. This is useful for injecting scripts, modifying content, or adding analytics.

Create a config file (e.g., `config.json`):

```json
{
  "replacements": [
    {
      "pattern": "</body>",
      "replacement": "<script>console.log('Injected via Chara Tunnel');</script></body>"
    },
    {
      "pattern": "<title>(.*?)</title>",
      "replacement": "<title>$1 [Dev]</title>"
    }
  ]
}
```

Then start the server with:

```bash
tunnel server --configFile config.json
```

## Use Cases

- **Development & Testing**: Expose your local dev server to the internet
- **Demos & Sharing**: Share your work with clients or team members
- **Webhook Testing**: Test webhook integrations with third-party services
- **Mobile App Testing**: Test your APIs with mobile applications over the internet
- **Content Injection**: Add scripts or stylesheets to any web page for testing

## Programmatic Usage

```javascript
import { TunnelClient, startServer } from '@chara-codes/tunnel';

// Start a client
const client = new TunnelClient({
  port: 3000,
  host: 'localhost',
  remoteHost: 'control.chara-ai.dev',
  subdomain: 'test.chara-ai.dev'
});

await client.connect();

// Start a server
startServer({
  port: 1337,
  domain: 'chara-ai.dev',
  controlDomain: 'control.chara-ai.dev',
  replacements: [
    { pattern: '</body>', replacement: '<script>console.log("Hello");</script></body>' }
  ]
});
```

## License

MIT
