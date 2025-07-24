# @chara-codes/agents

A comprehensive AI agents package for the Chara Codes ecosystem, providing multi-provider AI integration, agentic communication, and extensible tooling for building intelligent applications.

## Features

- 🤖 **Multi-Provider AI Support** - Seamless integration with 9 AI providers
- 🛠️ **Extensible Tool System** - Rich set of built-in tools with easy extensibility
- 🏃 **Process Runner** - Manage and monitor long-running development processes
- 📡 **Event-Driven Architecture** - Real-time communication via typed event emitters
- 🔧 **Model Context Protocol (MCP)** - Integration with external MCP servers
- 🌐 **WebSocket Support** - Real-time bidirectional communication
- 💬 **Ready-to-Use Agents** - Pre-built agents for common tasks

## Installation

```bash
bun install @chara-codes/agents
```

## Quick Start

### Setup

First, initialize your global configuration:

```bash
# Initialize global config with all provider variables
chara init
# or
npx @chara-codes/cli init
```

This creates `~/.chararc` in your home directory with all necessary environment variables. Add your API keys to this file.

**Example global config structure:**
```json
{
  "env": {
    "OPENAI_API_KEY": "your_openai_key_here",
    "ANTHROPIC_API_KEY": "your_anthropic_key_here",
    "GOOGLE_GENERATIVE_AI_API_KEY": "your_google_key_here",
    "DEEPSEEK_API_KEY": "your_deepseek_key_here",
    "OPEN_ROUTER_API_KEY": "your_openrouter_key_here",
    "OLLAMA_API_BASE_URL": "http://localhost:11434",
    "LMSTUDIO_API_BASE_URL": "http://localhost:1234/v1",
    "MOONSHOT_API_KEY": "your_moonshot_key_here",
    "DIAL_API_KEY": "your_dial_key_here",
    "DIAL_API_BASE_URL": "your_dial_base_url_here"
  },
  "defaultModel": "openai:::gpt-4o"
}
```

### Basic Agent Usage

```typescript
import { chatAgent, initialize } from '@chara-codes/agents';

// Initialize providers (reads from global config or env vars)
await initialize();

// Use the chat agent
const response = await chatAgent({
  model: 'openai:::gpt-4o',
  messages: [{ role: 'user', content: 'Hello, world!' }],
});

for await (const chunk of response.fullStream) {
  process.stdout.write(chunk.textDelta || '');
}
```

### Start the Server

```typescript
import { startServer } from '@chara-codes/agents';

// Server reads .chara.json for MCP, runner, and other configurations
const server = await startServer({
  port: 3031,
  websocket: { enabled: true },
  runner: { enabled: true }
});

console.log('Server running on http://localhost:3031');
```

## Supported AI Providers

The package supports multiple AI providers with automatic configuration and model discovery:

- **OpenAI** - GPT-4.1, GPT-4o, and other OpenAI models
- **Anthropic** - Claude 3.7 Sonnet, Claude 4 Sonnet, and other Claude models
- **Google** - Gemini Pro, Gemini Flash models
- **DeepSeek** - DeepSeek Chat and reasoning models
- **OpenRouter** - Access to 100+ models through a single API
- **Ollama** - Local model execution
- **LM Studio** - Local model serving
- **Moonshot** - Chinese AI models (Kimi K2 model)
- **DIAL** - EPAM AI platform integration

### Provider Configuration

#### Option 1: Global Configuration (Recommended)

Use the Chara CLI to initialize global configuration with all provider environment variables:

```bash
# Initialize global config (creates ~/.chararc)
chara init

# Or using npx
npx @chara-codes/cli init
```

This command creates a global configuration file in your home directory (`~/.chararc`) with all the necessary environment variables pre-configured. You just need to fill in your API keys.

#### Option 2: Environment Variables

Alternatively, set up providers using environment variables in your project's `.env` file:

```bash
# OpenAI
OPENAI_API_KEY=your_openai_key

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_key

# Google
GOOGLE_GENERATIVE_AI_API_KEY=your_google_key

# DeepSeek
DEEPSEEK_API_KEY=your_deepseek_key

# OpenRouter
OPEN_ROUTER_API_KEY=your_openrouter_key

# Ollama (local)
OLLAMA_API_BASE_URL=http://localhost:11434

# LM Studio (local)
LMSTUDIO_API_BASE_URL=http://localhost:1234/v1

# Moonshot
MOONSHOT_API_KEY=your_moonshot_key

# DIAL (EPAM)
DIAL_API_KEY=your_dial_key
DIAL_API_BASE_URL=your_dial_base_url
```

**Note:** The global configuration takes precedence over environment variables, making it easier to manage API keys across multiple projects.

### Dynamic Model Discovery

```typescript
import { fetchAllModels, getProvider } from '@chara-codes/agents';

// Fetch all available models
const allModels = await fetchAllModels();

// Get specific provider models
const openaiProvider = await getProvider('openai');
const models = await openaiProvider.fetchModels();
```

## Built-in Tools

The package includes a comprehensive set of tools for common AI agent tasks:

### File System Tools

- **read-file** - Read file contents with optional line ranges, automatic outline for large files, security validation
- **edit-file** - Create, edit, or overwrite files with granular edit operations and diff generation
- **move-file** - Move or rename files and directories using filesystem operations
- **file-system** - Unified file system operations with directory stats, file info, and environment analysis
- **directory** - List directory contents and generate tree structures with .gitignore support
- **mkdir** - Create directories with recursive parent creation

### Development Tools

- **terminal** - Execute shell commands with real-time output streaming and timeout protection
- **grep** - Search file contents with regex patterns, context lines, and glob filtering
- **find** - Find files by glob patterns with comprehensive filtering and .gitignore support
- **dev-server** - Manage and diagnose development processes with HTTP testing and log capture
- **examination** - Analyze code and project diagnostics with TypeScript, ESLint, Prettier, and Biome support

### Utility Tools

- **fetch** - HTTP requests with automatic HTML-to-Markdown conversion
- **thinking** - Structured engineering-focused problem-solving with sequential thoughts and branching

### Tool Usage Example

```typescript
import { tools } from '@chara-codes/agents';

// Read a file
const fileContent = await tools['read-file'].execute({
  path: 'src/index.ts',
  startLine: 1,
  endLine: 50
});

// Execute a command
const result = await tools.terminal.execute({
  command: 'npm test',
  cd: './my-project'
});
```

## Runner Service

The runner service manages long-running processes like development servers with real-time monitoring and logging.

### Basic Usage

```typescript
import { runnerService } from '@chara-codes/agents';

// Start a development server
const processId = await runnerService.start({
  command: 'npm run dev',
  cwd: './my-app'
});

// Monitor the process
runnerService.getStatus(processId);
```

### Runner Events

```typescript
import { appEvents } from '@chara-codes/agents';

// Listen to runner events
appEvents.on('runner:started', (data) => {
  console.log(`Process ${data.processId} started`);
});

appEvents.on('runner:output', (data) => {
  console.log(`[${data.type}] ${data.chunk}`);
});

appEvents.on('runner:stopped', (data) => {
  console.log(`Process stopped with code ${data.exitCode}`);
});
```

## Event System

The package uses a typed event emitter for real-time communication:

### Available Events

- **tool:calling** - Tool execution events
- **runner:started** - Process start events
- **runner:stopped** - Process termination events
- **runner:output** - Process output streams
- **runner:error** - Process error events
- **runner:status** - Process status updates

### Event Usage

```typescript
import { appEvents } from '@chara-codes/agents';

// Listen to specific events
appEvents.on('tool:calling', (data) => {
  console.log(`Calling tool: ${data.name}`);
});

// Pattern-based listening
appEvents.onPattern('runner:*', (eventName, data) => {
  console.log(`Runner event: ${eventName}`, data);
});

// Emit custom events
appEvents.emit('runner:restart', {
  processId: 'my-process',
  newCommand: 'npm run dev:new'
});
```

## Model Context Protocol (MCP)

Integration with external MCP servers for extended functionality is configured via your project's `.chara.json` file.

### MCP Configuration

Add an `mcpServers` object to your `.chara.json` file. The server will automatically detect and connect to the configured servers upon start.

**Example `.chara.json` with MCP servers:**
```json
{
  "dev": "npm run dev",
  "mcpServers": {
    "file-system-tools": {
      "command": "npx",
      "args": ["-y", "@model-protocol/server-filesystem", "./"],
      "enabled": true
    },
    "another-remote-server": {
      "url": "https://example.com/mcp-sse-endpoint",
      "enabled": true,
      "headers": {
        "x-api-key": "your-secret-key"
      }
    }
  }
}
```

### MCP Tools

MCP tools are automatically integrated with the local tool system:

```typescript
import { tools } from '@chara-codes/agents';

// Local and MCP tools are merged automatically
const allTools = tools; // Includes both local and MCP tools
```

## Pre-built Agents

### Chat Agent

General-purpose conversational agent with tool access:

```typescript
import { chatAgent } from '@chara-codes/agents';

const response = await chatAgent({
  model: 'anthropic:::claude-3-5-sonnet-20241022',
  messages: [
    { role: 'system', content: 'You are a helpful coding assistant.' },
    { role: 'user', content: 'Help me debug this function' }
  ],
  maxSteps: 5
});
```

### Git Agent

Specialized agent for Git operations:

```typescript
import { gitAgent } from '@chara-codes/agents';

const response = await gitAgent({
  model: 'openai:::gpt-4o',
  messages: [
    { role: 'user', content: 'Reset the repository to the last commit' }
  ]
});
```

### Beautify Agent

Code formatting and beautification:

```typescript
import { beautifyAgent } from '@chara-codes/agents';

const response = await beautifyAgent({
  model: 'deepseek:::deepseek-chat',
  code: 'function messy(){return"hello world"}',
  language: 'javascript'
});
```

### Initialization Agent

Project setup and configuration:

```typescript
import { initAgent } from '@chara-codes/agents';

const response = await initAgent({
  model: 'openai:::gpt-4o'
});
```

## WebSocket Integration

Real-time communication with client applications:

### Server Setup

```typescript
const server = await startServer({
  websocket: {
    enabled: true,
    endpoint: '/ws'
  }
});
```

### Client Connection

```javascript
const ws = new WebSocket('ws://localhost:3031/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data.event, data.data);
};

// Send runner commands
ws.send(JSON.stringify({
  event: 'runner:restart',
  data: { processId: 'my-process' }
}));
```

## API Endpoints

The server provides RESTful endpoints:

- `POST /api/chat` - Chat with agents
- `GET /api/status` - Server status
- `GET /api/models` - Available models
- `GET /api/providers` - Provider information
- `POST /api/beautify` - Code beautification
- `POST /api/git/reset` - Git operations

## Configuration

### Project Configuration (.chara.json)

```json
{
  "dev": "npm run dev",
  "build": "npm run build",
  "test": "npm test"
}
```

## Development

### Install Dependencies

```bash
bun install
```

### Run Development Server

```bash
bun run src/index.ts
```

### Run Tests

```bash
bun test
```

### Watch Mode

```bash
bun run ddev
```

## Architecture

The package is built with a modular architecture:

```
src/
├── agents/          # Pre-built AI agents
├── controllers/     # HTTP API controllers
├── mcp/            # Model Context Protocol integration
├── providers/      # AI provider implementations
├── services/       # Core services (events, runner)
├── tools/          # Built-in tool implementations
└── utils/          # Utility functions
```

## License

Apache License 2.0

Copyright (c) 2025 Chara Codes

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

See the main [LICENSE](../../LICENSE) file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Submit a pull request

For detailed contribution guidelines, see [CONTRIBUTING.md](../../CONTRIBUTING.md).
