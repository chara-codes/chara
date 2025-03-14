<p align="center">
    <img src="chara-logo.jpeg" alt="Chara Codes" title="Chara Codes" width=300/>
</p>

# Table of Contents
- [Introduction](#introduction)
- [Features](#features)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Architecture](#architecture)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [Documentation](#documentation)
- [License](#license)

## Introduction

Chara Codes is an AI-powered development environment designed to streamline frontend development workflows. It combines AI assistance with intuitive tools to help developers write, review, and manage code more efficiently. The platform provides real-time AI suggestions, code generation, and project management capabilities through a modern web interface.
In Greek, the word 'chara' (χαρά) means 'joy' or 'happiness'. Chara Codes aims to bring joy to developers by simplifying and enhancing their coding experience.

## Features

- 🤖 AI-powered code generation and suggestions
- 💻 Intuitive split interface with chat and preview panels
- 📝 Real-time code preview and editing
- 🔄 Seamless integration with multiple AI providers
- 🌐 Built-in Model Context Protocol (MCP) support
- 🚀 Project synchronization between local and remote environments
- 📊 Advanced code visualization and navigation
- 🔍 Smart code analysis and suggestions

## Project Structure

The project is organized as a monorepo with the following packages:

- `@chara/web` - Next.js frontend application
  - Split interface for chat and preview
  - Real-time code editing and preview
  - Responsive UI built with Tailwind and shadcn/ui

- `@chara/server` - Backend server application
  - tRPC API with WebSocket support
  - Multiple AI provider integrations
  - SQLite/LibSQL database with Drizzle ORM
  - Streaming response support

- `@chara/cli` - Command line interface
  - Project management and configuration
  - Development environment setup
  - MCP server integration
  - Local-remote sync capabilities

## Getting Started

```bash
# Clone the repository
git clone git@github.com:chara-codes/chara.git

# Install dependencies
bun install

# Start development servers
bun dev
```

## Architecture

Chara uses a modern stack with:

- **Frontend**: Next.js, React, TailwindCSS, shadcn/ui
- **Backend**: Bun, tRPC, Drizzle ORM, LibSQL
- **AI**: Multiple provider support through AI SDK
- **Real-time**: WebSocket for live updates
- **CLI**: Bun-powered command line tool

## Configuration

Each package can be configured independently:

- **Web**: Environment variables for API endpoints and features
- **Server**: `.env` file for database and AI provider settings
- **CLI**: `.chara.json` for project-specific configuration

See individual package READMEs for detailed configuration options.

## Documentation

### AI
 - [AI SDK](https://ai-sdk.dev/)
 - [Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
 - [Mastra Typescript Agentic Framework](https://mastra.ai/)

#### [Vibe Coding](https://en.wikipedia.org/wiki/Vibe_coding)
 - [Zed editor](https://zed.dev/)
 - [Cursor AI code editor](https://www.cursor.com/)
 - [v0](https://v0.dev/)
 - [bolt.new](https://bolt.new/)

#### MCP
 - [MCP](https://modelcontextprotocol.io/introduction)
 - [MCP Registry](https://mcp.so/)
 - [MCP Registry 1](https://mcp-get.com/)
 - [MCP Registry 2](https://smithery.ai/)
 - [Awesome MCP](https://github.com/punkpeye/awesome-mcp-servers)
 - [Awesome MCP 2](https://github.com/appcypher/awesome-mcp-servers)
 - [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk)

### Backend (@chara/server)
 - [tRPC.io](https://trpc.io/)
 - [Drizzle ORM](https://orm.drizzle.team/)
 - [libsql](https://github.com/tursodatabase/libsql)
 - [Vector DB, AI & Embedings with libsql](https://docs.turso.tech/features/ai-and-embeddings)

### Frontend (@chara/web)
 - [shadcn/ui](https://ui.shadcn.com/)

### CLI (@chara/cli)
 - [yargs](https://yargs.js.org/)
 - [picocolors](https://github.com/alexeyraspopov/picocolors)
 - [Isomorphic git](https://isomorphic-git.org/)

### Common
 - [bun javascript runtime](https://bun.sh/)
 - [zod](https://zod.dev/)

## License

MIT License

Copyright (c) 2025 Chara Codes

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
