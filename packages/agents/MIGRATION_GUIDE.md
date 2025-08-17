# Migration Guide: Class-based to Functional Chat Processor

This guide explains how to migrate from the old class-based `ChatProcessor` to the new functional chat processor that uses `UIMessage` from the AI SDK. **Note: The new functional processor has now replaced the old one as the default implementation.**

## Overview of Changes

### Key Improvements
- **UIMessage Format**: Now uses AI SDK's `UIMessage` format for better compatibility
- **Functional Approach**: Replaced class-based architecture with pure functions
- **Better Persistence**: Follows AI SDK documentation patterns for message persistence
- **Improved Streaming**: Uses `toUIMessageStreamResponse` for better streaming
- **Type Safety**: Better TypeScript integration with AI SDK types

### Breaking Changes
- Chat IDs are now strings instead of numbers
- Messages use `UIMessage` format instead of custom format
- Function-based API instead of class methods
- Different database schema for messages

## Migration Steps

### 1. Update Dependencies

Ensure you have the latest AI SDK version:

```json
{
  "dependencies": {
    "ai": "^5.0.15"
  }
}
```

### 2. Database Schema Migration

The new schema uses `UIMessage` format. You'll need to migrate your database:

```sql
-- Old messages table
CREATE TABLE messages_old AS SELECT * FROM messages;

-- Drop old table
DROP TABLE messages;

-- Create new messages table
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  parts TEXT NOT NULL, -- JSON array of UIMessage parts
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  metadata TEXT, -- JSON metadata
  commit TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  chat_id TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE
);

-- Update chats table to use text IDs
CREATE TABLE chats_new (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  parent_id TEXT REFERENCES chats_new(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'in_progress', 'completed', 'error'))
);
```

### 3. Code Migration

#### Old Class-based Approach (Legacy)

```typescript
// OLD: Class-based processor (now in chat-processor-legacy.ts)
import { ChatProcessor } from './chat-processor-legacy';

const processor = new ChatProcessor();

// Set tools
processor.setTools(mcpTools);

// Handle chat
await processor.handleChatSend({
  chatId: 123,
  model: 'gpt-4',
  messages: [
    { role: 'user', content: 'Hello' }
  ],
  mode: 'ask'
});

// Check if processing
if (processor.isProcessing(123)) {
  processor.handleChatCancel(123);
}

// Cleanup
processor.destroy();
```

#### New Functional Approach (Current)

```typescript
// NEW: Functional processor (now the main chat-processor.ts)
import {
  processChatMessage,
  setMcpTools,
  isProcessing,
  cancelChat,
  destroyAllChats
} from './chat-processor';
import { UIMessage } from 'ai';

// Set tools
setMcpTools(mcpTools);

// Create UIMessage format
const messages: UIMessage[] = [
  {
    id: 'msg-1',
    role: 'user',
    parts: [{ type: 'text', text: 'Hello' }],
    createdAt: new Date()
  }
];

// Handle chat
const response = await processChatMessage({
  chatId: 'chat-123',
  messages,
  model: 'gpt-4',
  mode: 'ask'
});

// Check if processing
if (isProcessing('chat-123')) {
  cancelChat('chat-123');
}

// Cleanup
destroyAllChats();
```

### 4. Message Format Migration

#### Old Message Format
```typescript
interface OldMessage {
  id: number;
  content: string;
  role: string;
  context?: any;
  toolCalls?: any;
}
```

#### New UIMessage Format
```typescript
interface UIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  parts: Array<{
    type: 'text' | 'tool-call' | 'tool-result' | 'reasoning';
    // ... type-specific properties
  }>;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
}
```

#### Migration Helper Function
```typescript
function migrateMessageToUIMessage(oldMessage: OldMessage): UIMessage {
  return {
    id: String(oldMessage.id),
    role: oldMessage.role as 'user' | 'assistant' | 'system',
    parts: [
      {
        type: 'text',
        text: oldMessage.content
      }
    ],
    metadata: {
      context: oldMessage.context,
      toolCalls: oldMessage.toolCalls
    },
    createdAt: new Date()
  };
}
```

### 5. API Endpoint Migration

#### Old TRPC Approach (Legacy)
```typescript
// OLD: Custom TRPC methods (now in chat-legacy.ts)
await trpc.chat.saveMessage.mutate({
  chatId: 123,
  content: 'Hello',
  role: 'user'
});

const history = await trpc.chat.getHistory.query({
  chatId: 123
});
```

#### New Repository Approach (Current)
```typescript
// NEW: UIMessage repository methods (now the main chatRepo.ts)
import { saveUIMessages, loadUIMessages } from './chatRepo';

await saveUIMessages('chat-123', messages);
const messages = await loadUIMessages('chat-123');
```

### 6. Streaming Response Migration

#### Old Streaming
```typescript
// OLD: Manual chunk broadcasting
processor.broadcastChunk(chatId, assistantMessageId, chunk, 'text');
```

#### New Streaming
```typescript
// NEW: AI SDK streaming response
const response = await processChatMessage(options);
// Returns Response object with proper streaming
return response; // Can be used directly in API endpoints
```

### 7. Hook System Migration

The hook system remains largely the same, but with updated parameter types:

```typescript
// OLD
interface ChatHooks {
  onChatStart?: (chatId: number, data: any) => Promise<void>;
  onChatComplete?: (chatId: number, response: string) => Promise<void>;
}

// NEW
interface ChatHooks {
  onChatStart?: (chatId: string, data: any) => Promise<void>;
  onChatComplete?: (chatId: string, response: string) => Promise<void>;
}
```

### 8. Testing Migration

#### Old Tests
```typescript
// OLD: Class-based testing
const processor = new ChatProcessor();
await processor.handleChatSend(data);
expect(processor.isProcessing(123)).toBe(true);
```

#### New Tests
```typescript
// NEW: Function-based testing
import { processChatMessage, isProcessing } from './chat-processor';

const response = await processChatMessage(options);
expect(isProcessing('chat-123')).toBe(true);
```

## Client-Side Integration

### AI SDK useChat Hook

The new functional processor works seamlessly with AI SDK's `useChat` hook:

```typescript
// Client-side React component
import { useChat } from '@ai-sdk/react';
import { defaultChatStoreOptions } from 'ai';

const { messages, sendMessage } = useChat({
  chatId: 'my-chat',
  chatStore: defaultChatStoreOptions({
    api: '/api/chat',
    // Optimize by sending only last message
    prepareRequestBody: ({ messages, chatId }) => ({
      chatId,
      message: messages[messages.length - 1],
      model: 'gpt-4',
      mode: 'ask'
    })
  })
});
```

### Server-side Handler

```typescript
// API route: /api/chat
import { appendClientMessage, convertToModelMessages } from 'ai';
import { processChatMessage, loadChatMessages } from './chat-processor';

export async function POST(req: Request) {
  const { chatId, message, model, mode } = await req.json();
  
  // Load previous messages
  const previousMessages = await loadChatMessages(chatId);
  
  // Append new message
  const messages = appendClientMessage({
    messages: previousMessages,
    message
  });
  
  // Process with functional processor
  return processChatMessage({
    chatId,
    messages,
    model,
    mode
  });
}
```

## Benefits of Migration

### 1. Better AI SDK Integration
- Native `UIMessage` support
- Compatible with `useChat` hook
- Follows AI SDK patterns

### 2. Improved Type Safety
- Stronger TypeScript types
- Better IDE support
- Compile-time error checking

### 3. Simplified Architecture
- Pure functions instead of classes
- Easier to test and debug
- Less state management complexity

### 4. Enhanced Streaming
- Better streaming performance
- Proper backpressure handling
- Client disconnect handling

### 5. Future-Proof
- Aligned with AI SDK roadmap
- Better ecosystem compatibility
- Easier to maintain

## Common Migration Issues

### 1. ID Type Conversion
**Problem**: Chat IDs changed from `number` to `string`
**Solution**: Update all ID references and use `String()` conversion

### 2. Message Format
**Problem**: Old message format incompatible
**Solution**: Use migration helper functions

### 3. Database Schema
**Problem**: Schema changes required
**Solution**: Run migration scripts carefully with backups

### 4. Streaming Responses
**Problem**: Different streaming format
**Solution**: Update client code to handle new response format

## Rollback Plan

If you need to rollback:

1. Old processor code is available in `chat-processor-legacy.ts`
2. Restore database from backup
3. Update imports to use legacy processor
4. Revert API endpoints to use legacy routes from `chat-legacy.ts`

## Support and Resources

- [AI SDK Documentation](https://ai-sdk.dev/)
- [UIMessage Reference](https://ai-sdk.dev/docs/reference/ui-message)
- [Chat Persistence Guide](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence)
- [Example Implementation](./examples/functional-chat-example.ts)
- [Legacy Files Available](./src/services/chat/chat-processor-legacy.ts)

## Timeline Recommendations

**Migration is now complete!** The new functional processor is the default implementation:

✅ **Completed Steps:**
1. **Dependencies Updated**: AI SDK v5 integrated
2. **Database Schema**: Updated to support UIMessage format
3. **Repository Layer**: New chatRepo.ts with UIMessage support
4. **Chat Processor**: Functional processor is now the main implementation
5. **API Endpoints**: Updated to use UIMessage format
6. **Tests**: Comprehensive unit tests for functional approach

**For New Projects:** Simply use the current implementation - no migration needed.

**For Existing Projects:** Legacy files are preserved with `-legacy` suffix for gradual migration.

Remember that legacy files remain available for compatibility during transition periods.