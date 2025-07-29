# Suggestion Agent

The suggestion agent analyzes the current development environment, project structure, and conversation context to generate relevant and actionable prompt suggestions for developers using streaming responses with tool integration.

## Overview

Unlike predefined suggestion lists, this agent dynamically generates contextually relevant prompts by:

- Using development tools to analyze the project structure and technologies
- Understanding the conversation history and user goals through streaming AI responses
- Identifying opportunities for improvement and development tasks in real-time
- Providing suggestions separated by `<--->` markers for easy parsing

## Features

- **Environment-Aware**: Uses tools like `directory`, `read-file`, `grep`, and `find` to analyze project files, dependencies, and structure
- **Context-Sensitive**: Considers conversation history and user intent through streaming responses
- **Real-time Analysis**: Streams suggestions as they are generated with tool calls visible
- **Separator-Based Format**: Uses `<--->` separators for easy parsing and UI integration
- **Tool Integration**: Leverages the same tools as the chat agent for comprehensive analysis
- **Streaming Response**: Provides immediate feedback and real-time suggestion generation

## Usage

### Basic Usage

```typescript
import { suggestionAgent } from '@chara-codes/agents';

const stream = await suggestionAgent({
  model: 'openai:::gpt-4o-mini',
  messages: conversationHistory,
  workingDir: '/path/to/project',
  maxSuggestions: 10
});

// Stream the response as it's generated
for await (const chunk of stream.textStream) {
  process.stdout.write(chunk);
}
```

### Get Suggestion Texts Only

For simple UI integration where you only need the suggestion text:

```typescript
import { suggestionAgent, parseSuggestionsFromResponse } from '@chara-codes/agents';

const stream = await suggestionAgent({
  model: 'openai:::gpt-4o-mini',
  messages: conversationHistory,
  workingDir: process.cwd()
});

let fullResponse = '';
for await (const chunk of stream.textStream) {
  fullResponse += chunk;
}

const suggestions = parseSuggestionsFromResponse(fullResponse);
// Output: Array of strings parsed from streamed response
// ['Help me implement error handling for API endpoints', 'Create unit tests for user authentication', ...]
```

### Parse Suggestions from Response

To parse suggestions from the streamed response:

```typescript
import { suggestionAgent, parseSuggestionsFromResponse } from '@chara-codes/agents';

const stream = await suggestionAgent({
  model: 'openai:::gpt-4o-mini',
  messages: conversationHistory
});

let fullResponse = '';
for await (const chunk of stream.textStream) {
  fullResponse += chunk;
}

// Parse suggestions separated by <--->
const suggestions = parseSuggestionsFromResponse(fullResponse);
// Output: Array of suggestion strings
// ['Help me implement error handling', 'Create unit tests', 'Add new features']
```

## Suggestion Categories

The agent generates suggestions across various development areas:

- **debug**: Error fixing, troubleshooting, and issue resolution
- **feature**: New functionality and feature development
- **architecture**: Code structure, design patterns, and organization
- **testing**: Unit tests, integration tests, and quality assurance
- **docs**: Documentation, comments, and knowledge sharing
- **learning**: Educational content and skill development
- **optimization**: Performance improvements and efficiency gains
- **maintenance**: Code cleanup, refactoring, and technical debt

Each suggestion is limited to 300 characters to ensure they are concise and actionable.

## Response Format

Suggestions are separated by `<--->` markers in the streaming response:

```
Help me implement error handling for the authentication API endpoints

<--->

Create unit tests for the React components using Jest and Testing Library

<--->

Optimize the database queries in the user service module
```

## Configuration Options

```typescript
interface SuggestionConfig {
  model: string;              // AI model to use (e.g., 'openai:::gpt-4o-mini')
  messages: CoreMessage[];    // Conversation history for context
  workingDir?: string;        // Project directory (defaults to process.cwd())
  maxSuggestions?: number;    // Maximum number of suggestions (defaults to 10)
}
```

**Note:** Each generated suggestion is limited to 300 characters to ensure clarity and conciseness.

## Example Output

```
Implement comprehensive error handling for the user authentication API endpoints
(96 characters)

<--->

Add TypeScript strict mode configuration to improve type safety
(73 characters)

<--->

Create unit tests for the React components in the dashboard module
(68 characters)

<--->

Set up automated testing pipeline with GitHub Actions for continuous integration
(89 characters)

<--->

Optimize the database queries in the product listing feature to reduce loading time
(89 characters)
```

All suggestions respect the 300-character limit while remaining clear and actionable.

## Environment Analysis

The suggestion agent uses development tools to analyze:

- **File Structure**: Uses `directory` and `file-system` tools to explore project organization
- **Dependencies**: Uses `read-file` to examine package.json, requirements.txt, and config files
- **Configuration**: Analyzes build tools, linters, formatters with `read-file` and `grep`
- **Code Patterns**: Uses `grep` and `find` to identify frameworks, libraries, and patterns
- **Testing Setup**: Searches for test files and testing frameworks using `find` and `grep`
- **Documentation**: Examines README files and documentation with `read-file` and `directory`

## Tool Integration

The agent has access to the same tools as the chat agent:
- `read-file`: Read specific files for analysis
- `file-system`: List and explore project structure
- `grep`: Search for patterns in code
- `find`: Locate files by name or type
- `directory`: Navigate project directories
- `examination`: Check for errors and code quality issues

## Integration with Other Agents

The suggestion agent works well with other Chara agents:

```typescript
// Use with chat agent for interactive development
const chatResponse = await chatAgent({
  model: 'openai:::gpt-4o-mini',
  messages: [...messages, { role: 'user', content: selectedSuggestion }],
  mode: 'write',
  workingDir: projectPath,
  tools: {},
  onFinish: (result) => console.log('Chat complete')
});

// Stream suggestions and then use chat agent
const stream = await suggestionAgent({
  model: 'openai:::gpt-4o-mini',
  messages: conversationHistory
});

let fullResponse = '';
for await (const chunk of stream.textStream) {
  fullResponse += chunk;
}

const suggestions = parseSuggestionsFromResponse(fullResponse);
// Use first suggestion with chat agent
```

## Error Handling

The agent provides error handling through:

- **Stream Error Handling**: Uses onError callback for stream failures
- **Tool Failures**: Individual tool failures don't stop the suggestion generation
- **Invalid Configuration**: Model parsing handles provider defaults gracefully

## Best Practices

1. **Provide Context**: Include relevant conversation history for better suggestions
2. **Set Working Directory**: Ensure the working directory points to your project root
3. **Adjust Max Suggestions**: Use 5-8 for UI dropdowns, 10-15 for comprehensive analysis
4. **Stream Processing**: Handle streaming responses appropriately for your UI
5. **Tool Analysis**: Let the agent use tools to analyze your project for better suggestions
6. **Parse Results**: Use `parseSuggestionsFromResponse` for consistent parsing
7. **Character Limit**: Each suggestion is automatically limited to 300 characters for optimal UI display

## Performance Considerations

- **Streaming**: Provides immediate feedback as suggestions are generated
- **Tool Usage**: Tool analysis adds time but provides much better suggestions
- **Resource Usage**: Analysis may take 5-15 seconds depending on project size and tool usage
- **Rate Limiting**: Respect AI provider rate limits when generating frequent suggestions
- **Memory**: Streaming responses are memory efficient for large suggestion sets

## Examples

See `examples/suggestion-agent-example.ts` for comprehensive usage examples including:

- Basic streaming suggestion generation
- Real-time processing with tool analysis
- Integration with different AI models
- Parsing utilities for UI integration
- Response parsing and formatting

## Contributing

When extending the suggestion agent:

1. Improve the tool usage patterns in the system prompt
2. Add new parsing utilities for different response formats
3. Optimize the streaming response handling
4. Add support for new project types through better tool integration
5. Enhance the suggestion relevance and quality

The suggestion agent is designed to be an intelligent development companion that uses real-time environment analysis to provide contextually relevant suggestions.