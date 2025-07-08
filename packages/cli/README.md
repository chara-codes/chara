# Chara CLI

[![npm version](https://badge.fury.io/js/chara.svg)](https://badge.fury.io/js/chara)
[![npm downloads](https://img.shields.io/npm/dm/chara.svg)](https://www.npmjs.com/package/chara)

A command-line interface tool for Chara Codes that facilitates AI-powered development workflow management.

## Features

- Development environment setup and configuration
- Integration with Model Context Protocol (MCP) for AI context management
- Project syncing between local and remote environments
- Configuration management via `.chara.json` files
- Seamless integration with web services via built-in server management

## Installation

### Stable Release (Latest)

```bash
# Install globally
npm install -g chara
# or
bun install -g chara

# Install locally in your project
npm install --save-dev chara
# or
bun add -d chara
```

### Alpha Release (Playground)

For testing the latest features from the playground branch:

```bash
# Install globally
npm install -g chara@alpha
# or
bun install -g chara@alpha

# Install locally in your project
npm install --save-dev chara@alpha
# or
bun add -d chara@alpha
```

> **Note**: Alpha releases are automatically published from the `playground` branch and may contain experimental features. Use stable releases for production environments.

## Basic Usage

```bash
# Start development mode
chara dev

# Get help
chara --help

# Check version
chara --version
```

## Configuration

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
    }
  }
}
```

### Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `host` | Host to serve on | `"localhost"` |
| `port` | Port to serve on | `3000` |
| `dev` | Command to run for development | `"bun dev"` |
| `mcpServers` | Model Context Protocol server configurations | `{}` |

## Development

```bash
# Install dependencies
bun install

# Run in development mode
bun d

# Build the CLI
bun build

# Run the compiled version
./dist/chara
```

## Model Context Protocol Integration

Chara CLI supports the Model Context Protocol for enhanced AI context awareness. Configure MCP servers in your `.chara.json` file to enable this feature.

Example usage:

```bash
# Start development with MCP context
chara dev
```

## License

MIT License

Copyright (c) 2025 Chara Codes

This project is licensed under the MIT License - see the main [LICENSE](../../LICENSE) file for details.
