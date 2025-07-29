# Suggest API Documentation

The Suggest API endpoint provides intelligent suggestions for development tasks based on project analysis and context. It uses AI agents with tools to explore the project structure, understand the technology stack, and identify opportunities for improvement.

## Endpoint

**POST** `/api/suggest`

## Request Format

### Headers
- `Content-Type: application/json`
- `Accept: text/event-stream` (optional, for streaming response)

### Query Parameters
- `maxSuggestions` (optional): Maximum number of suggestions to generate (default: 10)

### Request Body

```json
{
  "model": "string",
  "messages": "CoreMessage[]",
  "userMessageId": "number (optional)"
}
```

#### Parameters

- **model** (required): AI model to use in format `provider:::model-name`
  - Example: `"openai:::gpt-4o-mini"`
  - Example: `"anthropic:::claude-3-haiku-20240307"`

- **messages** (required): Array of conversation messages
  ```json
  [
    {
      "role": "user|assistant|system",
      "content": "string"
    }
  ]
  ```

- **userMessageId** (optional): ID of the user message for tracking purposes

## Response Format

The API returns a streaming response with Server-Sent Events (SSE) format:

```
data: {"type":"text-delta","textDelta":"suggestion text..."}
data: {"type":"tool-call","toolCall":{"toolName":"readFile","args":{"path":"package.json"}}}
data: {"type":"tool-result","result":"..."}
data: [DONE]
```

### Response Types

1. **text-delta**: Incremental text content from the AI
2. **tool-call**: When the agent uses tools to analyze the project
3. **tool-result**: Results from tool execution
4. **finish**: Final response metadata

## Suggestion Format

Suggestions are separated by `<--->` markers in the response text:

```
First suggestion about improving TypeScript configuration

<--->

Second suggestion about adding tests

<--->

Third suggestion about optimizing build process
```

## Example Usage

### Basic Request

```javascript
const response = await fetch('/api/suggest?maxSuggestions=5', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'openai:::gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: 'I need suggestions for improving my TypeScript project. What should I work on next?'
      }
    ]
  })
});
```

### Streaming Response Handling

```javascript
const reader = response.body.getReader();
const decoder = new TextDecoder();
let fullResponse = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value, { stream: true });
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') break;

      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'text-delta') {
          fullResponse += parsed.textDelta;
          console.log(parsed.textDelta);
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
  }
}
```

### Parsing Suggestions

```javascript
import { parseSuggestionsFromResponse } from '@chara-codes/agents';

const suggestions = parseSuggestionsFromResponse(fullResponse);
console.log(`Found ${suggestions.length} suggestions:`);
suggestions.forEach((suggestion, index) => {
  console.log(`${index + 1}. ${suggestion}`);
});
```

## CORS Support

The endpoint includes CORS headers for cross-origin requests:

- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`

### Preflight Request

```javascript
const corsCheck = await fetch('/api/suggest', {
  method: 'OPTIONS'
});
```

## Error Handling

### HTTP Status Codes

- **200**: Success with streaming response
- **400**: Bad request (invalid parameters)
- **500**: Internal server error

### Error Response Format

```json
{
  "error": "Error message description"
}
```

## Agent Capabilities

The suggestion agent has access to various tools for project analysis:

### File System Tools
- **readFile**: Read file contents
- **directory**: List directory contents and tree structure
- **fileSystem**: Get file/directory statistics and environment info

### Analysis Tools
- **grep**: Search for patterns in files
- **find**: Find files by name patterns
- **examination**: Analyze code structure and patterns

### Development Tools
- **terminal**: Execute shell commands (read-only mode)
- **thinking**: Internal reasoning and planning

## Use Cases

### Project Analysis
```json
{
  "model": "openai:::gpt-4o-mini",
  "messages": [
    {
      "role": "user",
      "content": "Analyze my project structure and suggest improvements for code organization."
    }
  ]
}
```

### Technology Stack Review
```json
{
  "model": "openai:::gpt-4o-mini",
  "messages": [
    {
      "role": "user",
      "content": "Review my package.json and suggest modern alternatives or upgrades for my dependencies."
    }
  ]
}
```

### Code Quality Improvements
```json
{
  "model": "openai:::gpt-4o-mini",
  "messages": [
    {
      "role": "user",
      "content": "What can I do to improve code quality and maintainability in this TypeScript project?"
    }
  ]
}
```

## Integration with MCP Tools

The suggestion agent supports Model Context Protocol (MCP) tools for extended functionality. External tools are automatically merged with built-in tools when available.

## Rate Limiting

Currently, no rate limiting is implemented. Consider implementing rate limiting for production use.

## Security Considerations

- The agent runs in "ask" mode with read-only file system access
- Terminal commands are executed but cannot modify the system
- All tool usage is logged for debugging purposes
- No sensitive data should be included in requests as they may be logged

## Troubleshooting

### Common Issues

1. **Connection Refused**: Ensure the server is running on the correct port
2. **Stream Timeout**: Large projects may take longer to analyze
3. **Empty Suggestions**: Check that the working directory contains a valid project
4. **Tool Errors**: File permission issues or missing dependencies

### Debug Information

The server logs tool usage and errors. Check the console output for:
- Tool call details
- File system operations
- Error messages and stack traces