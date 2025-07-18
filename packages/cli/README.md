# Chara CLI

[![npm version](https://badge.fury.io/js/@chara-codes%2Fcli.svg)](https://badge.fury.io/js/@chara-codes%2Fcli)
[![npm downloads](https://img.shields.io/npm/dm/@chara-codes%2Fcli.svg)](https://www.npmjs.com/package/@chara-codes%2Fcli)

A command-line interface tool for Chara Codes that facilitates AI-powered development workflow management.

## Features

- **Development Environment Setup**: Complete development server with hot-reload support
- **AI Model Integration**: Configure and manage AI models for development assistance
- **Model Context Protocol (MCP)**: Full integration with MCP for enhanced AI context management
- **Project Configuration**: Automated setup and configuration management via `.chara.json` files
- **Tunnel Support**: Built-in tunneling for local development with remote access
- **Web Interface**: Integrated web UI for managing development workflow
- **Real-time Communication**: WebSocket support for live updates and interactions

## Installation

### Stable Release (Latest)

```bash
# Install globally
npm install -g @chara-codes/cli
# or
bun install -g @chara-codes/cli

# Install locally in your project
npm install --save-dev @chara-codes/cli
# or
bun add -d @chara-codes/cli
```

## Commands

### `chara dev`

Start the full development environment with Chara Codes integration.

```bash
chara dev [options]
```

**Options:**
- `-p, --projectDir <path>` - Project root directory (default: current directory)
- `-v, --verbose` - Enable debug logs
- `-t, --trace` - Enable trace logs (includes debug logs)

**What it does:**
- Sets up logging and project configuration
- Initializes global and local configurations if needed
- Starts backend server (port 3030)
- Starts agents server (port 3031)
- Connects to MCP servers if configured
- Launches web interface (port 1237)
- Sets up tunneling for `*.localhost` domains
- Enables real-time communication via WebSocket

**Example:**
```bash
# Start development with current directory
chara dev

# Start with specific project directory and verbose logging
chara dev --projectDir ./my-project --verbose

# Start with trace logging for debugging
chara dev --trace
```

### `chara init`

Initialize Chara configuration with AI provider settings.

```bash
chara init [options]
```

**Options:**
- `-f, --force` - Force initialization even if config exists
- `-v, --verbose` - Enable verbose output
- `-s, --show` - Show current configuration and exit
- `-r, --reset` - Reset/clear all configuration

**What it does:**
- Creates global configuration for AI providers
- Sets up default AI model selection
- Configures authentication for AI services
- Initializes project-specific settings

**Examples:**
```bash
# Initialize with interactive prompts
chara init

# Force re-initialization
chara init --force

# Show current configuration
chara init --show

# Reset all configuration
chara init --reset
```

### `chara default-model`

Set or update the default AI model for Chara Codes.

```bash
chara default-model [options]
```

**Options:**
- `-p, --port <number>` - Port to start server on (default: 3031)
- `-v, --verbose` - Enable verbose output

**What it does:**
- Starts a temporary server to fetch available models
- Presents an interactive model selection interface
- Updates the global configuration with the selected model
- Automatically stops the server after configuration

**Example:**
```bash
# Set default model with interactive selection
chara default-model

# Set default model with custom port
chara default-model --port 8080
```

### `chara initialize-config`

Initialize project-specific Chara configuration.

```bash
chara initialize-config [options]
```

**Options:**
- `-c, --config-file <path>` - Path to configuration file (default: `.chara.json`)
- `-v, --verbose` - Enable verbose output

**What it does:**
- Creates a local `.chara.json` configuration file
- Inherits settings from global configuration
- Sets up project-specific MCP server configurations
- Configures local development preferences

**Example:**
```bash
# Initialize with default config file
chara initialize-config

# Initialize with custom config file path
chara initialize-config --config-file ./config/chara.json
```

## Configuration

### Global Configuration

Global settings are stored in the user's home directory and include:
- AI provider credentials and settings
- Default AI model selection
- User preferences and authentication tokens

### Project Configuration (`.chara.json`)

Create a `.chara.json` file in your project root:

```json
{
  "host": "localhost",
  "port": 3000,
  "dev": "bun dev",
  "mcpServers": {
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/project"]
    }
  }
}
```

### Configuration Options

| Option | Description | Default | Type |
|--------|-------------|---------|------|
| `host` | Host to serve on | `"localhost"` | string |
| `port` | Port to serve on | `3000` | number |
| `dev` | Command to run for development | `"bun dev"` | string |
| `mcpServers` | Model Context Protocol server configurations | `{}` | object |

### MCP Server Configuration

Configure MCP servers to enhance AI context awareness:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "command-to-run",
      "args": ["arg1", "arg2", "..."],
      "env": {
        "ENV_VAR": "value"
      }
    }
  }
}
```

**Popular MCP Servers:**
- `@modelcontextprotocol/server-puppeteer` - Browser automation
- `@modelcontextprotocol/server-filesystem` - File system access
- `@modelcontextprotocol/server-git` - Git repository integration
- `@modelcontextprotocol/server-postgres` - PostgreSQL database access

## Development Workflow

### Quick Start

> **Important**: Always run `chara dev` from within your project folder/directory.

**Option 1: Automatic Setup (Recommended)**

1. **Navigate to your project directory:**
   ```bash
   cd /path/to/your/project
   ```

2. **Start development (auto-initializes if needed):**
   ```bash
   chara dev
   ```

   The `dev` command automatically handles:
   - ✅ **Global configuration**: Runs `chara init` if no global config exists
   - ✅ **Default model setup**: Configures AI model selection if not set
   - ✅ **Project configuration**: Creates `.chara.json` if not present
   - ✅ **Complete environment**: Starts all necessary servers and services

3. **Access the web interface:**
   - Open `http://localhost:1237` in your browser
   - Backend API available at `http://localhost:3030`
   - Agents API available at `http://localhost:3031`

**Option 2: Manual Setup**

1. **Navigate to your project directory:**
   ```bash
   cd /path/to/your/project
   ```

2. **Initialize global configuration:**
   ```bash
   chara init
   ```

3. **Initialize project configuration:**
   ```bash
   chara initialize-config
   ```

4. **Start development:**
   ```bash
   chara dev
   ```

### Advanced Setup

1. **Configure MCP servers** in `.chara.json`
2. **Set up localhost tunneling** by adding to `/etc/hosts`:
   ```
   127.0.0.1 control.localhost chara.localhost
   ```
3. **Access via tunnel** at `http://chara.localhost:1337`

## Tunnel Configuration

For local development with remote access capabilities:

1. Add to your `/etc/hosts` file:
   ```
   127.0.0.1 control.localhost chara.localhost
   ```

2. Start development:
   ```bash
   chara dev
   ```

3. Access your application:
   - Local: `http://localhost:1237`
   - Tunnel: `http://chara.localhost:1337`

## Development

```bash
# Install dependencies
bun install

# Run in development mode
bun run dev

# Build the CLI
bun run build

# Run tests
bun test

# Run the compiled version
./dist/chara
```

## Troubleshooting

### Logs and Debugging

Enable verbose logging for troubleshooting:
```bash
chara dev --verbose    # Debug level logs
chara dev --trace      # Trace level logs (most detailed)
```

## Model Context Protocol Integration

Chara CLI provides full integration with the Model Context Protocol for enhanced AI context awareness:

- **Automatic Discovery**: Automatically detects and connects to configured MCP servers
- **Real-time Communication**: Maintains persistent connections to MCP servers
- **Context Sharing**: Shares project context with AI models through MCP
- **Tool Integration**: Enables AI models to use MCP tools and resources

### Supported MCP Features

- **Resources**: File system access, database connections, API endpoints
- **Tools**: Function calling, code execution, external integrations
- **Prompts**: Pre-configured prompts and templates
- **Sampling**: AI model interaction and response handling

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
