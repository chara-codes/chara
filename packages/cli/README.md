# Chara CLI

A command-line interface tool for Chara Codes that facilitates AI-powered development workflow management.

## Features

- Development environment setup and configuration
- Integration with Model Context Protocol (MCP) for AI context management
- Project syncing between local and remote environments
- Configuration management via `.chara.json` files
- Seamless integration with web services via built-in server management

## Installation

### Global Installation

```bash
npm install -g chara
# or
bun install -g chara
```

### Local Installation

```bash
# In your project
npm install --save-dev chara
# or
bun add -d chara
```

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
