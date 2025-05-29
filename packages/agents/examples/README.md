# AI Providers Registry Examples

This folder contains example code demonstrating how to use the AI providers registry.

## Prerequisites

1. **Install dependencies**:
   ```bash
   cd chara/packages/agents
   bun install
   ```

2. **Configure environment variables**:
   Copy the `.env.example` file to `.env` and add your API keys:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add at least one provider API key:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   GROQ_API_KEY=your_groq_api_key_here
   # Add other providers as needed
   ```

3. **Ensure you have valid API keys** for at least one provider to see the demos in action.

## Available Examples

### `providers-demo.ts`

A comprehensive demonstration of the providers registry featuring:

- **Provider Discovery**: Lists all available and configured providers
- **Provider Status**: Shows which providers are available and ready to use
- **Text Generation**: Tests text generation with multiple providers
- **Streaming**: Demonstrates streaming responses
- **Error Handling**: Shows proper error handling for unavailable providers
- **Provider Comparison**: Compares responses from different providers
- **Dynamic Selection**: Selects providers based on task requirements

## Running the Examples

### Run the Main Demo

```bash
# From the agents package directory
bun run examples/providers-demo.ts
```

### Run with Specific Log Level

```bash
# Set log level to see more details
LOG_LEVEL=DEBUG bun run examples/providers-demo.ts
```

### Run Individual Functions

You can import and run specific demo functions in your own code:

```typescript
import { demonstrateProvidersRegistry, compareProviders } from './providers-demo.js';
import { getModel } from '../src/providers-registry.js';

// Run just the basic demo
await demonstrateProvidersRegistry();

// Or run provider comparison
await compareProviders();

// Use specific models with providers
const openaiModel = getModel('openai', 'gpt-4o');
const claudeModel = getModel('anthropic', 'claude-3-5-sonnet-20241022');
```

1. **Initialization Summary**: Which providers were successfully initialized
2. **Available Providers**: List of working providers and their models
3. **Provider Status**: Success/failure status for each provider
4. **Text Generation Tests**: Responses from each available provider
5. **Streaming Demo**: Real-time streaming text generation
6. **Error Handling**: Demonstration of graceful error handling
7. **Provider Comparison**: Side-by-side responses to the same question
8. **Dynamic Selection**: Task-based provider selection

## Expected Output

When you run the demo with configured providers, you should see:

1. **Initialization Summary**: Which providers were successfully initialized
2. **Available Providers**: List of working providers and their models
3. **Provider Status**: Success/failure status for each provider
4. **Text Generation Tests**: Responses from each available provider
5. **Streaming Demo**: Real-time streaming text generation
6. **Error Handling**: Demonstration of graceful error handling
7. **Provider Comparison**: Side-by-side responses to the same question
8. **Dynamic Selection**: Task-based provider selection

## Troubleshooting

### No Providers Available

If you see "No providers available":
- Check that your `.env` file exists and contains valid API keys
- Verify API keys are correctly formatted and have sufficient credits
- Check the console for specific initialization errors

### Provider Initialization Errors

Common issues:
- **Invalid API Key**: Double-check the key format and validity
- **Network Issues**: Ensure internet connectivity
- **Rate Limits**: Some providers have rate limits for new accounts
- **Insufficient Credits**: Ensure your account has available credits

### Ollama Not Working

If using Ollama locally:
- Ensure Ollama is installed and running: `ollama serve`
- Pull required models: `ollama pull llama3.1`
- Verify the base URL is correct in your `.env`

## Adding Custom Examples

To create your own examples:

1. Create a new `.ts` file in this directory
2. Import the providers registry:
   ```typescript
   import { getModel, hasProvider } from '../src/providers-registry.js';
   ```
3. Use the logger for consistent output:
   ```typescript
   import { logger } from '@chara/logger';
   ```
4. Always specify model names when calling getModel():
   ```typescript
   const model = getModel('openai', 'gpt-4o');
   ```
5. Follow the patterns shown in `providers-demo.ts`

## Configuration Examples

### Minimal Setup (Free Options)
```env
GROQ_API_KEY=your_groq_key_here
OLLAMA_API_BASE_URL=http://127.0.0.1:11434
```

### Production Setup
```env
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
MISTRAL_API_KEY=your_mistral_key_here
GROQ_API_KEY=your_groq_key_here
```

### Complete Setup
```env
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
GOOGLE_GENERATIVE_AI_API_KEY=your_google_key_here
MISTRAL_API_KEY=your_mistral_key_here
GROQ_API_KEY=your_groq_key_here
OPEN_ROUTER_API_KEY=your_openrouter_key_here
XAI_API_KEY=your_xai_key_here
OLLAMA_API_BASE_URL=http://127.0.0.1:11434
```

For detailed configuration instructions, see `../src/providers-config.md`.
