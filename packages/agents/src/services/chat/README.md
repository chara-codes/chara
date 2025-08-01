# Chat Service Architecture

This directory contains the refactored chat service, broken down into modular components for better maintainability and extensibility.

## Overview

The chat service has been restructured from a single monolithic `websocket-chat.ts` file into multiple focused modules:

```
services/chat/
├── README.md                    # This documentation
├── types.ts                     # TypeScript interfaces and types
├── hooks.ts                     # Hook system for pointcuts/AOP
├── subscription-manager.ts      # WebSocket subscription management
├── status-manager.ts           # Chat status tracking
├── chat-processor.ts           # Main chat processing logic
├── callback-examples.ts        # Example implementations
└── index.ts                    # Exports for the module
```

## Architecture Components

### 1. Types (`types.ts`)
Contains all TypeScript interfaces and type definitions used across the chat service:
- `ChatStatus` - Status tracking for chats
- `ChatSubscription` - WebSocket subscription information
- Event interfaces (`ChatSendEvent`, `ChatCompleteEvent`, etc.)
- `ChatHooks` - Interface for service-level pointcut hooks
- `ChatAgentCallbacks` - Interface for agent-level callbacks

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

const result = await chatAgent({
  model: "openai:::gpt-4o-mini",
  messages: [{ role: "user", content: "Hello!" }],
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

4. **Error Handling**: If errors occur
   - `onError` callback called
   - `onChatError` hook called
   - Status updated to `error`
   - Error broadcast to subscribers

5. **Cancellation**: If cancelled by user
   - Abort signal triggered
   - `onChatCancel` hook called
   - Status updated to `completed`
   - Streams properly terminated

## Benefits of This Architecture

### 1. **Multi-Level Hooks**
- **Service Level**: High-level business logic (database, notifications)
- **Agent Level**: Real-time processing (streaming, progress tracking)

### 2. **Proper Abort Handling**
- Abort signals properly bound to chat agent
- Graceful cancellation of ongoing operations
- Combined abort signals from multiple sources

### 3. **Real-Time Callbacks**
- Stream chunks as they arrive
- Step-by-step progress tracking
- Immediate error handling

### 4. **Extensibility**
The dual hook system allows you to add functionality at different levels:
- Service hooks for business logic
- Agent callbacks for real-time processing

### 5. **Type Safety**
Strong TypeScript typing for all callbacks and hooks ensures compile-time error checking.

### 6. **Separation of Concerns**
- Service manages high-level workflow
- Agent handles AI processing details
- Clear boundaries between responsibilities

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

## Migration from Old Architecture

### Import Changes
```typescript
// Old
import { webSocketChatService } from "./services/websocket-chat";

// New
import { chatService } from "./services/chat";
```

### New Capabilities
```typescript
// Centralized event routing (new)
chatService.handleEvent("chat:send", data, ws);

// Service-level hooks (new)
chatService.registerHooks({
  onChatComplete: async (chatId, response, usage) => { /* */ }
});

// Agent-level callbacks (new)
chatService.registerChatAgentHooks({
  onChunk: async (chunk) => { /* */ }
});

// Direct agent usage with callbacks (new)
const result = await chatAgent({
  model: "gpt-4",
  messages: [...],
  callbacks: { onChunk: async (chunk) => { /* */ } },
  abortSignal: controller.signal
});
```

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

Potential areas for future development:

1. **Middleware System**: Add middleware for cross-cutting concerns
2. **Rate Limiting**: Implement per-user rate limiting with callbacks
3. **Response Caching**: Cache responses with invalidation hooks
4. **A/B Testing**: Test different models/prompts with metrics hooks
5. **Content Moderation**: Advanced content filtering with real-time callbacks
6. **Performance Monitoring**: Detailed performance metrics collection
7. **Circuit Breakers**: Implement circuit breakers with error callbacks
8. **Distributed Tracing**: Add tracing support across all callbacks