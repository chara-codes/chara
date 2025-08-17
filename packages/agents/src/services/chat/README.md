# Chat Service Architecture

This directory contains both the legacy class-based chat service and the new functional chat processor that uses AI SDK's `UIMessage` format.

## Overview

The chat service has been refactored to provide two approaches:

### Legacy Class-based Approach (chat-processor.ts)
The original implementation using classes and custom message formats.

### New Functional Approach (chat-processor-new.ts)
A modern implementation following AI SDK patterns with `UIMessage` format.

```
services/chat/
├── README.md                    # This documentation
├── types.ts                     # TypeScript interfaces and types (updated for UIMessage)
├── hooks.ts                     # Hook system for pointcuts/AOP
├── subscription-manager.ts      # WebSocket subscription management
├── status-manager.ts           # Chat status tracking
├── chat-processor.ts           # Legacy class-based processor
├── chat-processor-new.ts       # New functional processor with UIMessage
├── callback-examples.ts        # Example implementations
└── index.ts                    # Exports for the module
```

## Migration to Functional Approach

The new functional approach provides several benefits:
- **UIMessage Compatibility**: Uses AI SDK's `UIMessage` format for better ecosystem integration
- **Functional Design**: Pure functions instead of classes for easier testing and debugging
- **Better Persistence**: Follows AI SDK documentation patterns for message persistence
- **Improved Streaming**: Uses `toUIMessageStreamResponse` for proper streaming
- **Type Safety**: Better TypeScript integration with AI SDK types

See [MIGRATION_GUIDE.md](../../MIGRATION_GUIDE.md) for detailed migration instructions.

## Architecture Components

### 1. Types (`types.ts`)
Contains all TypeScript interfaces and type definitions used across the chat service:
- `ChatStatus` - Status tracking for chats (now uses string IDs)
- `ChatSubscription` - WebSocket subscription information
- Event interfaces (`ChatSendEvent`, `ChatCompleteEvent`, etc.) - updated for UIMessage
- `ChatHooks` - Interface for service-level pointcut hooks
- `ChatAgentCallbacks` - Interface for agent-level callbacks
- `UIMessage` - AI SDK message format integration

### 2. Hooks System (`hooks.ts`)
Implements an aspect-oriented programming (AOP) style hook system that provides pointcuts for:
- `onChatStart` - Called when a chat begins processing
- `onChatComplete` - Called when a chat completes successfully
- `onChatError` - Called when a chat encounters an error
- `onChatCancel` - Called when a chat is cancelled
- `onStatusUpdate` - Called on any status change
- `onMessageUpdate` - Called when a message is updated with commit info

### 3. Chat Agent Callbacks
The chat agent now supports real-time callbacks for fine-grained control:
- `onChunk` - Called for each text chunk during streaming
- `onStepFinish` - Called when each AI reasoning step completes
- `onFinish` - Called when the entire chat conversation finishes
- `onError` - Called when an error occurs during processing

### 4. Subscription Manager (`subscription-manager.ts`)
Handles WebSocket connection management:
- Subscribe/unsubscribe clients to specific chats
- Broadcast events to all subscribers of a chat
- Clean up disconnected clients
- Track subscription statistics

### 5. Status Manager (`status-manager.ts`)
Manages chat status lifecycle:
- Track chat status (idle, in_progress, completed, error)
- Automatic cleanup of stale statuses
- Status change notifications through hooks
- Query active chats and statistics

### 6. Chat Processor (`chat-processor.ts`)
Contains the core chat processing logic:
- Handle chat send requests
- Process AI agent streams with callbacks
- Handle cancellation with proper abort signal binding
- Git integration for write mode
- Tool management (MCP tools)

### 7. Main Service (`../chat.ts`)
Orchestrates all components and provides a unified API:
- Single entry point for all chat operations
- Centralized event routing for `chat:*` events
- Coordinates between managers
- Provides service statistics
- Handles lifecycle management

## Usage

### Basic Usage

#### Legacy Class-based Approach
```typescript
import { chatService } from "./services/chat";

// Subscribe a WebSocket to a chat
const subscriptionId = chatService.subscribeToChat(chatId, ws);

// Send a chat message
await chatService.handleChatSend({
  chatId: 123,
  model: "gpt-4",
  messages: [...],
  mode: "ask"
});

// Cancel a chat
chatService.handleChatCancel({ chatId: 123 });

// Get chat status
const status = chatService.getChatStatus(123);
```

#### New Functional Approach
```typescript
import {
  processChatMessage,
  setMcpTools,
  createNewChat,
  loadChatMessages,
  cancelChat,
  isProcessing
} from "./chat-processor-new";
import { UIMessage } from "ai";

// Set MCP tools
setMcpTools(mcpTools);

// Create a new chat
const chatId = await createNewChat("My Chat");

// Create UIMessage format
const messages: UIMessage[] = [
  {
    id: 'msg-1',
    role: 'user',
    parts: [{ type: 'text', text: 'Hello!' }],
    createdAt: new Date()
  }
];

// Process chat message
const response = await processChatMessage({
  chatId,
  messages,
  model: 'gpt-4',
  mode: 'ask'
});

// Check if processing
if (isProcessing(chatId)) {
  cancelChat(chatId);
}

// Load existing messages
const existingMessages = await loadChatMessages(chatId);
```

### Event Routing

The chat service now provides centralized event routing for all `chat:*` events:

```typescript
// In your WebSocket message handler
if (data.event && data.event.startsWith("chat:")) {
  chatService.handleEvent(data.event, data.data, ws);
}
```

Supported events:
- `chat:send` - Start a new chat conversation
- `chat:cancel` - Cancel an ongoing chat
- `chat:subscribe` - Subscribe to chat updates
- `chat:unsubscribe` - Unsubscribe from specific chat
- `chat:unsubscribe-all` - Unsubscribe from all chats

The service includes automatic validation and error handling for all events.

### Service-Level Hook System

#### Legacy Approach
Register hooks for high-level chat events:

```typescript
import { chatService } from "./services/chat";

// Register hooks for database updates, logging, etc.
chatService.registerHooks({
  onChatStart: async (chatId, data) => {
    console.log(`Chat ${chatId} started with model ${data.model}`);
    // Update database, send notifications, etc.
  },
  
  onChatComplete: async (chatId, response, usage) => {
    console.log(`Chat ${chatId} completed`);
    // Save response to database, calculate costs, etc.
  },
  
  onChatError: async (chatId, error) => {
    console.log(`Chat ${chatId} failed: ${error}`);
    // Log error, send alerts, etc.
  }
});
```

#### New Functional Approach
The functional approach uses the existing hook system but with UIMessage-compatible data:

```typescript
import { chatHooksManager } from "./hooks";

// Hooks work the same way but with string IDs and UIMessage data
chatHooksManager.registerHooks({
  onChatStart: async (chatId: string, data) => {
    console.log(`Chat ${chatId} started with model ${data.model}`);
    // chatId is now a string, data.messages are UIMessage[]
  },
  
  onChatComplete: async (chatId: string, response, usage) => {
    console.log(`Chat ${chatId} completed`);
    // Save UIMessage conversation to database
  }
});
```

### Chat Agent Callbacks

Register callbacks for real-time processing events:

```typescript
import { chatService } from "./services/chat";

// Register callbacks for real-time processing
chatService.registerChatAgentHooks({
  onChunk: async (chunk) => {
    console.log(`Streaming: ${chunk}`);
    // Real-time UI updates, content filtering, etc.
  },
  
  onStepFinish: async (stepResult) => {
    console.log(`Step completed: ${stepResult.stepType}`);
    // Progress tracking, tool call analytics, etc.
  },
  
  onFinish: async (result) => {
    console.log(`Agent finished with ${result.steps.length} steps`);
    // Final processing, cleanup, etc.
  },
  
  onError: async (error) => {
    console.error(`Agent error: ${error.message}`);
    // Error handling, fallback mechanisms, etc.
  }
});
```

### Direct Chat Agent Usage

Use the chat agent directly with callbacks and abort signals:

```typescript
import { chatAgent } from "./agents/chat-agent";
import { convertToModelMessages } from "ai";

const result = await chatAgent({
  model: "openai:::gpt-4o-mini",
  messages: convertToModelMessages(uiMessages), // Convert UIMessage to ModelMessage
  mode: "ask",
  workingDir: process.cwd(),
  tools: {},
  abortSignal: AbortSignal.timeout(30000), // 30 second timeout
  callbacks: {
    onChunk: async (chunk) => {
      console.log(`📤 Chunk: ${chunk}`);
    },
    onStepFinish: async (step) => {
      console.log(`🔧 Step: ${step.stepType}`);
    },
    onFinish: async (result) => {
      console.log(`🏁 Done: ${result.steps.length} steps`);
    },
    onError: async (error) => {
      console.error(`💥 Error: ${error.message}`);
    },
  },
});

// New functional approach returns streaming response
const streamResponse = result.toUIMessageStreamResponse({
  originalMessages: uiMessages,
  onFinish: async ({ messages }) => {
    // Save complete conversation in UIMessage format
    await saveUIMessages(chatId, messages);
  }
});
```

### Abort Signal Management

The chat agent now properly handles abort signals:

```typescript
// Create an abort controller
const controller = new AbortController();

// Start chat with abort signal
const result = await chatAgent({
  model: "gpt-4",
  messages: [...],
  mode: "ask",
  workingDir: process.cwd(),
  abortSignal: controller.signal,
  callbacks: { /* ... */ }
});

// Cancel the chat from elsewhere
controller.abort("User requested cancellation");
```

### Database Integration Example

```typescript
import { initializeDatabaseHooks } from "./services/chat/callback-examples";
import { prisma } from "./your-db-client";

// Initialize comprehensive database integration
const systems = initializeDatabaseHooks(prisma);

// The hooks will automatically:
// - Update chat status in database
// - Save assistant responses
// - Track usage statistics and metrics
// - Log tool usage for analytics
// - Handle error states
```

## Event Flow

### Service-Level Events

#### Legacy Approach
1. **Chat Start**: Client sends `chat:send` event
   - `onChatStart` hook called
   - Status updated to `in_progress`
   - Chat agent started with callbacks

2. **Chat Processing**: Real-time callbacks during processing
   - `onChunk` called for each text piece
   - `onStepFinish` called for each reasoning step
   - Status remains `in_progress`

3. **Chat Completion**: Stream ends
   - `onFinish` called with final result
   - `onChatComplete` hook called
   - Status updated to `completed`
   - Git commit created (write mode)

#### New Functional Approach
1. **Chat Processing**: Direct function call
   - `processChatMessage()` called with UIMessage array
   - Returns streaming Response object
   - Hooks called at appropriate points

2. **AI SDK Integration**: Uses standard AI SDK patterns
   - `convertToModelMessages()` for agent input
   - `toUIMessageStreamResponse()` for streaming output
   - `onFinish` callback saves complete conversation

3. **Persistence**: Following AI SDK documentation
   - Complete UIMessage array saved on finish
   - Compatible with AI SDK's `useChat` hook
   - Optimized request patterns supported

4. **Error Handling**: Functional error handling
   - Errors thrown from functions
   - Proper cleanup in finally blocks
   - AbortSignal support for cancellation

## Benefits of This Architecture

### Legacy Approach Benefits
1. **Multi-Level Hooks**: Service and agent level callbacks
2. **Proper Abort Handling**: Graceful cancellation support
3. **Real-Time Callbacks**: Streaming and progress tracking
4. **Extensibility**: Dual hook system for different concerns
5. **Type Safety**: Strong TypeScript typing
6. **Separation of Concerns**: Clear boundaries between components

### New Functional Approach Benefits

#### 1. **AI SDK Integration**
- Native `UIMessage` format support
- Compatible with `useChat` hook
- Follows AI SDK documentation patterns
- Standard streaming responses

#### 2. **Simplified Architecture**
- Pure functions instead of classes
- Easier to test and reason about
- Less state management complexity
- Functional composition patterns

#### 3. **Better Persistence**
- Complete conversation history in UIMessage format
- Optimized request patterns (send only last message)
- AI SDK persistence patterns
- Database schema aligned with UIMessage

#### 4. **Future-Proof Design**
- Aligned with AI SDK roadmap
- Better ecosystem compatibility
- Standard patterns and conventions
- Easier maintenance and updates

#### 5. **Enhanced Developer Experience**
- Better TypeScript inference
- More predictable behavior
- Easier debugging and testing
- Clear data flow patterns

#### 6. **Performance Improvements**
- Reduced memory usage (no class instances)
- Better garbage collection
- Optimized streaming patterns
- Efficient message handling

## Advanced Examples

### Metrics Collection System
```typescript
class MetricsCollector {
  registerHooks() {
    chatService.registerHooks({
      onChatStart: async (chatId) => {
        this.startTimer(chatId);
      },
      onChatComplete: async (chatId, response, usage) => {
        this.recordMetrics(chatId, { response, usage });
      }
    });

    chatService.registerChatAgentHooks({
      onChunk: async (chunk) => {
        this.incrementChunkCount();
      },
      onStepFinish: async (step) => {
        this.recordStepMetrics(step);
      }
    });
  }
}
```

### Content Filtering System
```typescript
class ContentFilter {
  registerHooks() {
    chatService.registerChatAgentHooks({
      onChunk: async (chunk) => {
        if (this.containsForbiddenContent(chunk)) {
          this.flagContent(chunk);
        }
      },
      onFinish: async (result) => {
        const issues = this.scanFullResponse(result.text);
        if (issues.length > 0) {
          this.quarantineResponse(result, issues);
        }
      }
    });
  }
}
```

## Migration Paths

### 1. Legacy to Modular (Existing)
```typescript
// Old
import { webSocketChatService } from "./services/websocket-chat";

// New
import { chatService } from "./services/chat";
```

### 2. Legacy to Functional (Recommended)
```typescript
// Old class-based approach
import { ChatProcessor } from "./chat-processor";
const processor = new ChatProcessor();
await processor.handleChatSend(data);

// New functional approach
import { processChatMessage } from "./chat-processor-new";
const response = await processChatMessage(options);
```

### 3. Message Format Migration
```typescript
// Old custom format
interface OldMessage {
  id: number;
  content: string;
  role: string;
}

// New UIMessage format
interface UIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  parts: Array<{ type: 'text'; text: string }>;
  createdAt?: Date;
  metadata?: Record<string, unknown>;
}
```

### 4. Database Schema Updates
The new functional approach requires schema changes:
- Chat IDs: `number` → `string`
- Messages: Custom format → UIMessage parts array
- Better indexing and foreign key relationships

See [MIGRATION_GUIDE.md](../../MIGRATION_GUIDE.md) for detailed instructions.

## Configuration

### Environment Variables
- `CHAT_CLEANUP_INTERVAL` - How often to clean up stale statuses (default: 5 minutes)
- `CHAT_STATUS_TIMEOUT` - How long to keep completed chat statuses (default: 2 hours)

### Tool Configuration
```typescript
chatService.setTools(mcpTools);
```

## Monitoring and Debugging

### Service Statistics
```typescript
const stats = chatService.getServiceStats();
console.log(stats);
// {
//   statusCounts: { idle: 5, inProgress: 2, completed: 10, error: 1 },
//   activeChats: [123, 456],
//   processingChats: [123, 456],
//   subscribedChats: [123, 456, 789]
// }
```

### Logging
The service uses structured logging at different levels:
- `debug` - Detailed operation logs including callbacks
- `info` - Important events and hook executions
- `warn` - Warning conditions and content filtering
- `error` - Error conditions and failed callbacks

## Future Enhancements

### Functional Approach Roadmap
1. **AI SDK Features**: Implement latest AI SDK capabilities (tool calling, structured outputs)
2. **Resumable Streams**: Add stream resumption support for long conversations
3. **Multi-Modal Support**: Extend UIMessage for images, audio, and other media
4. **Edge Runtime**: Optimize for edge deployment with AI SDK
5. **Streaming Optimizations**: Implement advanced streaming patterns
6. **Client Synchronization**: Better offline/online sync with UIMessage
7. **Component Libraries**: Pre-built UI components for UIMessage rendering

### General Enhancements
1. **Middleware System**: Add middleware for cross-cutting concerns
2. **Rate Limiting**: Implement per-user rate limiting with callbacks
3. **Response Caching**: Cache responses with invalidation hooks
4. **A/B Testing**: Test different models/prompts with metrics hooks
5. **Content Moderation**: Advanced content filtering with real-time callbacks
6. **Performance Monitoring**: Detailed performance metrics collection
7. **Circuit Breakers**: Implement circuit breakers with error callbacks
8. **Distributed Tracing**: Add tracing support across all callbacks

## Examples and Resources

- [Functional Chat Examples](../../../examples/functional-chat-example.ts)
- [Migration Guide](../../MIGRATION_GUIDE.md)
- [AI SDK Documentation](https://ai-sdk.dev/)
- [UIMessage Reference](https://ai-sdk.dev/docs/reference/ui-message)
- [Chat Persistence Patterns](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence)