# Mastra.ai Integration

This is a simple implementation of Mastra.ai integration using Anthropic as the model provider.

## Installing Dependencies

The following dependencies are required:

```bash
bun add @mastra/core @mastra/mcp @ai-sdk/anthropic dotenv
```

## .env Configuration

Create a `.env` file in the project root with the following variables:

```
# Anthropic configuration
ANTHROPIC_API_KEY=your_anthropic_api_key
ANTHROPIC_MODEL=claude-3-haiku-20240307
```

## Features

1. Mastra Agent

   - Uses Anthropic (Claude) as the model
   - Integration with MCP for accessing tools

2. MCP (Model Context Protocol) Client

   - Simple configuration to connect to the server
   - Provides tools to the agent via getTools()

3. Agent Endpoint
   - Text-based responses
   - Support for tools through MCP

## Usage

### Starting the Server

```bash
cd packages/server
bun run dev
```

### Using the Agent API

Send a POST request to `/agent` with a JSON body:

```json
{
  "message": "Your message"
}
```

### MCP Client Setup

The MCP client uses a minimal configuration:

```typescript
import { MCPClient } from "@mastra/mcp";

export const mcp = new MCPClient({
  servers: {
    agent: {
      url: new URL("http://localhost:3035/sse"),
      logger: (logMessage) => {
        console.log(`[Mastra MCP] ${logMessage.level}: ${logMessage.message}`);
      },
    },
  },
});
```

### Mastra Agent with MCP Tools

```typescript
import { Agent } from "@mastra/core/agent";
import { anthropic } from "@ai-sdk/anthropic";
import { mcp } from "./mcp/client";

// Async function to create an agent
const createAgent = async () => {
  // Get tools from MCP
  const tools = await mcp.getTools();

  // Create an agent with tools
  return new Agent({
    name: "Mastra AI Agent",
    instructions: "You are a helpful assistant.",
    model: anthropic("claude-3-haiku-20240307"),
    tools: tools,
  });
};
```

## Notes about implementation

1. Ensure you have the necessary API keys for each provider
2. For Anthropic: set ANTHROPIC_API_KEY in environment variables
