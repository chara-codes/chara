# Chat API Examples

This directory contains examples demonstrating how to use the `/api/chat` endpoint of the Chara agents server.

## Overview

The `/api/chat` endpoint provides a REST API interface to interact with chat agents. It supports both "ask" and "write" modes, with streaming responses for real-time interaction.

## Endpoint Details

- **URL**: `http://localhost:3031/api/chat`
- **Methods**: 
  - `POST` - Send chat messages and get AI responses
  - `GET` - Load existing chat messages
  - `OPTIONS` - CORS preflight

## Request Format (POST)

```json
{
  "chatId": "unique-chat-identifier",
  "messages": [
    {
      "id": "message-id",
      "role": "user",
      "parts": [
        {
          "type": "text",
          "text": "Your message content"
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "metadata": {
        "optional": "metadata"
      }
    }
  ],
  "model": "openai:::gpt-4o-mini",
  "mode": "ask"
}
```

### Parameters

- **chatId** (string): Unique identifier for the chat session
- **messages** (UIMessage[]): Array of messages in the conversation
- **model** (string): Model to use (format: `provider:::model`)
- **mode** (string): Either "ask" (read-only) or "write" (can modify files)

### Response

The endpoint returns a streaming response with the AI's reply. The response is streamed in real-time as the AI generates it.

## Examples

### 1. Simple Chat Example

Run a basic chat interaction:

```bash
bun run examples/simple-chat-api.ts
```

This example demonstrates:
- Creating a user message
- Sending a request to the chat API
- Reading the streaming response
- Using both "ask" and "write" modes

### 2. Comprehensive Chat API Test

Run all test scenarios:

```bash
bun run examples/test-chat-api.ts
```

This example covers:
- Basic chat functionality
- Continued conversations
- Write mode (file operations)
- Loading existing messages
- Error handling
- CORS testing

## Usage Patterns

### Basic Chat

```typescript
import { generateId, UIMessage } from "ai";

const chatId = generateId();
const userMessage: UIMessage = {
  id: generateId(),
  role: "user",
  parts: [{ type: "text", text: "Hello!" }],
  createdAt: new Date(),
};

const response = await fetch("http://localhost:3031/api/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Accept: "text/plain",
  },
  body: JSON.stringify({
    chatId,
    messages: [userMessage],
    model: "openai:::gpt-4o-mini",
    mode: "ask",
  }),
});

// Read streaming response
const reader = response.body?.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = new TextDecoder().decode(value);
  process.stdout.write(chunk);
}
```

### Continued Conversation

To continue a conversation, include all previous messages in the request:

```typescript
const allMessages = [
  previousUserMessage,
  previousAssistantMessage,
  newUserMessage,
];

const response = await fetch("http://localhost:3031/api/chat", {
  method: "POST",
  body: JSON.stringify({
    chatId: sameOrNewChatId,
    messages: allMessages,
    model: "openai:::gpt-4o-mini",
    mode: "ask",
  }),
});
```

### Write Mode (File Operations)

Use "write" mode to enable file operations and code generation:

```typescript
const response = await fetch("http://localhost:3031/api/chat", {
  method: "POST",
  body: JSON.stringify({
    chatId,
    messages: [userMessage],
    model: "openai:::gpt-4o-mini",
    mode: "write", // Enables file operations
  }),
});
```

### Loading Chat Messages

Retrieve existing messages for a chat:

```typescript
const response = await fetch(
  `http://localhost:3031/api/chat?chatId=${chatId}`,
  {
    method: "GET",
    headers: { Accept: "application/json" },
  }
);

const result = await response.json();
console.log(result.messages); // Array of UIMessage
```

## Available Models

Common model formats:
- `openai:::gpt-4o-mini`
- `openai:::gpt-4`
- `anthropic:::claude-3-sonnet-20240229`
- `google:::gemini-pro`

Use the `/api/models` endpoint to get the full list of available models.

## Error Handling

The API returns proper HTTP status codes:
- `200` - Success
- `400` - Bad Request (missing required fields)
- `500` - Internal Server Error

Error responses include JSON with error details:

```json
{
  "error": "Missing required fields: chatId, messages, model, mode",
  "code": "CHAT_ERROR"
}
```

## Working Directory

The chat agent operates in the current working directory (`process.cwd()`). In write mode, files will be created/modified relative to this directory.

## Tools Available

### Ask Mode Tools (Read-only)
- Read files
- Search files
- Examine project structure
- Fetch web content
- Development server interaction

### Write Mode Tools (All ask mode tools plus)
- Create/edit files
- Move files
- Create directories
- Terminal commands
- Git operations

## Running the Examples

1. Start the Chara agents server:
   ```bash
   cd chara/packages/agents
   bun run src/index.ts
   ```

2. In another terminal, run the examples:
   ```bash
   # Simple example
   bun run examples/simple-chat-api.ts
   
   # Comprehensive tests
   bun run examples/test-chat-api.ts
   ```

## Integration with AI SDK

The chat endpoint is compatible with AI SDK patterns. You can use it with the AI SDK's streaming utilities:

```typescript
import { generateId } from "ai";

// The endpoint returns AI SDK compatible streaming responses
// that work with UI frameworks like React
```

## Notes

- The endpoint uses `process.cwd()` as the working directory
- Chat messages are automatically saved to the database
- Git operations are performed automatically in write mode
- The response is streamed for real-time interaction
- CORS is enabled for cross-origin requests