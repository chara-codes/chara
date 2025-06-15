# Agents

This directory contains various AI agents that provide specialized functionality for different development tasks.

## Available Agents

### Chat Agent (`chat-agent.ts`)
The main conversational AI agent that handles general development queries and provides assistance with coding tasks.

**Usage:**
```typescript
import { chatAgent } from './chat-agent';

const result = await chatAgent({
  model: "openai:::gpt-4o-mini",
  messages: [
    { role: "user", content: "Help me write a React component" }
  ]
});
```

### Init Agent (`init-agent.ts`)
Analyzes project structure and generates a `.chara.json` configuration file with project information, development commands, and technology stack details.

**Purpose:**
- Automatically detect project type and technology stack
- Generate development server commands
- Identify frameworks, tools, and dependencies
- Create standardized project configuration

**Usage:**
```typescript
import { initAgent } from './init-agent';

const result = await initAgent({
  model: "openai:::gpt-4o-mini",
  workingDir: "/path/to/project" // optional, defaults to process.cwd()
});

// Stream the response
for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}
```

**Generated .chara.json Structure:**
```json
{
  "dev": "command to start development server",
  "info": {
    "name": "project name",
    "description": "project description",
    "version": "project version",
    "frameworks": ["react", "nextjs", "vue", "angular"],
    "tools": ["vite", "webpack", "turbo", "playwright"],
    "stack": ["typescript", "nodejs", "python"],
    "packageManager": "npm|yarn|pnpm|bun",
    "scripts": {"script1": "command1"},
    "dependencies": ["production dependencies"],
    "devDependencies": ["development dependencies"],
    "languages": ["typescript", "javascript"],
    "projectType": "web|api|library|cli|mobile|desktop|other"
  }
}
```

**Detection Logic:**
- **Package Manager**: Checks for lock files (bun.lockb, yarn.lock, pnpm-lock.yaml, package-lock.json)
- **Frameworks**: Analyzes dependencies and config files (next.config.js, vite.config.ts, etc.)
- **Project Type**: Determines based on dependencies and structure
- **Dev Command**: Looks for common script names in package.json or suggests framework defaults

**Supported Project Types:**
- **web**: Frontend applications (React, Vue, Angular, Svelte)
- **api**: Backend services (Express, Fastify, tRPC servers)
- **library**: Reusable packages and libraries
- **cli**: Command-line tools and utilities
- **mobile**: React Native, Flutter applications
- **desktop**: Electron, Tauri applications
- **other**: Projects that don't fit standard categories

### Beautify Agent (`beautify-agent.ts`)
Handles code formatting and beautification tasks.

### Git Agent (`git-agent.ts`)
Provides Git-related functionality and version control assistance.

## Common Patterns

All agents follow these patterns:

### Model Configuration
```typescript
// Default model
model: "openai:::gpt-4o-mini"

// Custom provider and model
model: "anthropic:::claude-3-haiku"
model: "ollama:::llama3.2"
```

### Streaming Responses
```typescript
const result = await agent({ model, ...params });

for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}
```

### Tool Access
All agents have access to the complete tool suite:
- File system operations (read, write, edit, move)
- Directory operations (list, tree, search)
- Terminal commands
- Git operations
- Web fetching
- Thinking and analysis tools

## Adding New Agents

1. Create a new file following the naming pattern `{name}-agent.ts`
2. Implement the agent function with proper TypeScript types
3. Create a corresponding prompt in `../prompts/{name}.ts`
4. Export the agent from `index.ts`
5. Add documentation to this README

### Agent Template
```typescript
import { streamText, type CoreMessage } from "ai";
import { providersRegistry } from "../providers";
import { logger } from "@chara/logger";
import { tools } from "../tools";
import { myPrompt } from "../prompts/my-prompt";

export const myAgent = async (
  {
    model,
    // Add your specific parameters here
  }: {
    model: string;
    // Define parameter types
  },
  options: { headers?: Record<string, string> } = {},
) => {
  const [providerName = "openai", modelName = "gpt-4o-mini"] =
    model.split(":::");
  const aiModel = providersRegistry.getModel(providerName, modelName);
  logger.info(providerName, modelName);

  const messages: CoreMessage[] = [
    {
      role: "user",
      content: "Your initial prompt here",
    },
  ];

  return streamText({
    ...options,
    system: myPrompt({
      hasTools: !!Object.keys(tools).length,
      hasTool: (name) => Object.keys(tools).includes(name),
    }),
    tools: {
      ...tools,
    },
    model: aiModel,
    toolCallStreaming: true,
    experimental_continueSteps: true,
    maxSteps: 50,
    messages,
  });
};
```

## Configuration

Agents can be configured through:

1. **Environment variables**: For API keys and provider settings
2. **Provider registry**: For model availability and configuration
3. **Tool availability**: Based on the tools index
4. **Options parameter**: For request-specific headers and settings

## Error Handling

All agents should handle:
- Invalid model specifications
- Missing API keys or provider configuration
- Tool execution failures
- Network errors
- Rate limiting

## Testing

Test your agents using the pattern:
```typescript
// test-my-agent.js
import { myAgent } from "./packages/agents/src/agents/my-agent.js";

async function testMyAgent() {
  try {
    const result = await myAgent({
      model: "openai:::gpt-4o-mini",
      // your parameters
    });

    for await (const chunk of result.textStream) {
      process.stdout.write(chunk);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

testMyAgent().catch(console.error);
```
