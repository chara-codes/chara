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

3. **Ensure you have valid API keys** for at least one provider to see the demos in action. For DIAL examples, both `DIAL_API_KEY` and `DIAL_API_BASE_URL` are required.

## Available Examples

### `providers-demo.ts`

A comprehensive demonstration of the providers registry featuring:

- **Provider Discovery**: Lists all available and configured providers
- **Provider Status**: Shows which providers are available and ready to use
- **Model Fetching**: Demonstrates fetching available models from provider APIs
- **Text Generation**: Tests text generation with multiple providers
- **Streaming**: Demonstrates streaming responses
- **Error Handling**: Shows proper error handling for unavailable providers
- **Provider Comparison**: Compares responses from different providers
- **Dynamic Selection**: Selects providers based on task requirements
- **DIAL Integration**: Shows how to use the DIAL provider for advanced models

### `model-fetching-demo.ts`

A focused demonstration of the model fetching capabilities:

- **Model Discovery**: Shows which providers support dynamic model fetching
- **Live Model Fetching**: Fetches real models from provider APIs (like OpenAI)
- **Model Analysis**: Analyzes and categorizes available models by type
- **Error Handling**: Demonstrates proper error handling for model fetching
- **Statistics**: Shows model counts and availability across providers

### `dial-example.ts`

A demonstration of using the DIAL provider:

- **Model Discovery**: Fetches and displays available DIAL models
- **Text Generation**: Tests basic text generation with DIAL models
- **Streaming Response**: Shows real-time streaming responses
- **Multi-turn Conversations**: Demonstrates conversation handling
- **Advanced Features**: Uses models with thinking/reasoning capabilities

### `dial-agent-call.ts`

A demonstration of using DIAL models with the chat agent:

- **Agent Integration**: Uses DIAL models with the chat agent architecture
- **Model Selection**: Automatically finds and uses available DIAL models
- **Multi-turn Conversations**: Shows how to handle conversation context
- **Thinking Models**: Demonstrates models with explicit reasoning capabilities
- **Error Handling**: Shows proper error handling for DIAL-specific scenarios

### `dial-tools-example.ts`

A demonstration of using DIAL models with various AI SDK features:

- **Simple Prompting**: Shows basic Q&A with DIAL models
- **System Prompts**: Demonstrates guiding the model with system instructions
- **Structured Output**: Shows how to request JSON-formatted responses
- **Model Selection**: Automatically selects from available DIAL models
- **Error Handling**: Demonstrates proper error handling for DIAL models
</edits>

<edits>

<old_text>
```typescript
import { demonstrateProvidersRegistry, compareProviders, demonstrateModelFetching } from './providers-demo.js';
import { demonstrateModelFetching as demoModelFetching } from './model-fetching-demo.js';
import { getModel, fetchModels, fetchAllModels } from '../src/providers-registry.js';

// Run just the basic demo
await demonstrateProvidersRegistry();

// Or run provider comparison
await compareProviders();

// Demonstrate model fetching
await demonstrateModelFetching();

// Or run the dedicated model fetching demo
await demoModelFetching();

// Use specific models with providers
const openaiModel = getModel('openai', 'gpt-4o');
const claudeModel = getModel('anthropic', 'claude-3-5-sonnet-20241022');

// Fetch available models dynamically
const openaiModels = await fetchModels('openai');
const allModels = await fetchAllModels();
```

## Running the Examples

### Run the Main Demo

```bash
# From the agents package directory
bun run examples/providers-demo.ts

# Or run the model fetching demo
bun run examples/model-fetching-demo.ts
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
2. **Available Providers**: List of working providers and their status
3. **Provider Status**: Success/failure status for each provider
4. **Model Fetching**: Live fetching of available models from provider APIs
5. **Text Generation Tests**: Responses from each available provider
6. **Streaming Demo**: Real-time streaming text generation
7. **Error Handling**: Demonstration of graceful error handling
8. **Provider Comparison**: Side-by-side responses to the same question
9. **Dynamic Selection**: Task-based provider selection

### Model Fetching Demo Output

When you run `model-fetching-demo.ts`, you should see:

1. **Provider Support Status**: Which providers support model fetching
2. **Live Model Lists**: Real models fetched from APIs (e.g., 75+ OpenAI models)
3. **Model Analysis**: Categorization of models by type (GPT, Claude, etc.)
4. **Statistics**: Model counts and provider coverage
5. **Error Handling**: Proper handling of unsupported providers
</edits>

<edits>

<old_text>
4. Always specify model names when calling getModel():
   ```typescript
   const model = getModel('openai', 'gpt-4o');
   ```
5. Use model fetching to discover available models:
   ```typescript
   const models = await fetchModels('openai');
   const allModels = await fetchAllModels();
   ```
6. Follow the patterns shown in `providers-demo.ts`

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
   import { logger } from '@chara-codes/logger';
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
DIAL_API_KEY=your_dial_key_here
DIAL_API_BASE_URL=your_dial_base_url_here
OLLAMA_API_BASE_URL=http://127.0.0.1:11434
```

## Running DIAL Examples

To run the DIAL examples, make sure you have set both `DIAL_API_KEY` and `DIAL_API_BASE_URL` in your `.env` file, then:

```bash
# Run the basic DIAL provider demo
bun run examples/dial-example.ts

# Run the DIAL chat agent demo
bun run examples/dial-agent-call.ts

# Run the DIAL features demo
bun run examples/dial-tools-example.ts
```

For detailed configuration instructions, see `../src/providers-config.md`.
