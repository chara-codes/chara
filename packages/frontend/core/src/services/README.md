# WebSocket Services Architecture

This directory contains the WebSocket communication layer for the Chara frontend. The architecture is designed to provide a single, shared WebSocket connection with specialized services for different functionality.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    WebSocket Services                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   chat-service  │    │ runner-service  │                │
│  │                 │    │                 │                │
│  │ • Chat events   │    │ • Dev server    │                │
│  │ • Subscriptions │    │ • Process mgmt  │                │
│  │ • Tool calls    │    │ • Log streaming │                │
│  └─────────┬───────┘    └─────────┬───────┘                │
│            │                      │                        │
│            └──────┬───────────────┘                        │
│                   │                                        │
│            ┌──────▼───────┐                                │
│            │ websocket-   │                                │
│            │ service.ts   │                                │
│            │              │                                │
│            │ • Connection │                                │
│            │ • Reconnect  │                                │
│            │ • Callbacks  │                                │
│            │ • Status     │                                │
│            └──────────────┘                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Services

### 🔌 `websocket-service.ts`
**Core WebSocket communication service**

- Manages a single WebSocket connection to the server
- Handles connection, reconnection, and error management
- Provides connection status monitoring
- Routes messages to appropriate service handlers
- Singleton instance: `webSocketService`

**Key Features:**
- Exponential backoff reconnection
- Connection status observers
- Service registration system
- Message routing

### 💬 `chat-service.ts`
**Chat-specific event handling**

- Handles chat subscriptions and message sending
- Processes chat events (status, chunks, completions, errors)
- Manages tool call parsing and display
- Singleton instance: `chatService`

**Key Features:**
- Chat room subscriptions
- Real-time message streaming
- Tool call handling
- Error management

### 🏃 `runner-service.ts`
**Dev-server operations**

- Manages development server processes
- Handles process output streaming
- Controls server restart and management
- Singleton instance: `runnerService`

**Key Features:**
- Process status monitoring
- Log streaming (stdout/stderr)
- Server restart controls
- Process management

## Usage Examples

### Basic Chat Usage
```typescript
import { chatService } from '@chara-codes/core/services';

// Connect to WebSocket
await chatService.connect();

// Subscribe to a chat
chatService.subscribeToChat(chatId, {
  onTextDelta: (delta) => console.log('New text:', delta),
  onToolCall: (toolCall) => console.log('Tool called:', toolCall),
  onChatComplete: (data) => console.log('Chat complete:', data),
});

// Send a message
chatService.sendMessage({
  chatId,
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello!' }],
  mode: 'ask'
});
```

### Basic Runner Usage
```typescript
import { runnerService } from '@chara-codes/core/services';

// Connect to WebSocket
await runnerService.connect({
  onRunnerOutput: (data) => console.log('Output:', data.chunk),
  onRunnerStatus: (data) => console.log('Status:', data.status),
});

// Get server status
runnerService.getStatus();

// Restart a process
runnerService.restart('process-id', 'npm run dev');
```

### Connection Monitoring
```typescript
import { webSocketService } from '@chara-codes/core/services';

// Monitor connection status
const unsubscribe = webSocketService.onStatusChange((status) => {
  console.log('Connected:', status.connected);
  console.log('Reconnecting:', status.reconnecting);
  console.log('Attempts:', status.reconnectAttempts);
});

// Manual reconnection
await webSocketService.reconnect();

// Check current status
const status = webSocketService.getConnectionStatus();
```

## React Integration

### Using with Stores
```typescript
import { useChatStore, useRunnerConnection } from '@chara-codes/core';

function MyComponent() {
  const { isConnected, isConnecting } = useRunnerConnection();
  const chats = useChatStore(state => state.chats);
  
  return (
    <div>
      Status: {isConnected ? 'Connected' : 'Disconnected'}
      Chats: {chats.length}
    </div>
  );
}
```

### Using Connection Status Hook
```typescript
import { useWebSocketStatus } from '@chara-codes/core';

function ConnectionIndicator() {
  const { status, reconnect } = useWebSocketStatus();
  
  return (
    <div>
      <span>Status: {status.connected ? '🟢' : '🔴'}</span>
      {!status.connected && (
        <button onClick={reconnect}>Reconnect</button>
      )}
    </div>
  );
}
```

## Types

All WebSocket-related types are defined in `../types/websocket-types.ts`:

- `ConnectionStatus` - WebSocket connection state
- `ChatEvent` - Chat-related WebSocket events
- `RunnerEvent` - Runner-related WebSocket events
- `SharedWebSocketCallbacks` - Combined callback interface
- And more...

## Error Handling

### Connection Failures
Services gracefully handle connection failures:
- Automatic reconnection with exponential backoff
- Fallback to cached data when possible
- Clear error reporting for debugging

### Message Failures
Individual message failures don't affect the connection:
- Failed messages are queued for retry
- Error callbacks provide specific failure information
- Services continue operating normally

## Debugging

### Debug Panel
Use the debug panel component for real-time monitoring:
```typescript
import { DebugPanel } from '@chara-codes/design-system';

<DebugPanel visible={showDebug} onClose={() => setShowDebug(false)} />
```

### Connection Testing
```typescript
import { quickConnectionTest } from '@chara-codes/core';

// Test WebSocket connectivity
const result = await quickConnectionTest();
console.log('Connection test:', result ? 'PASSED' : 'FAILED');
```

### Console Testing
```typescript
// Available in browser console as window.testWebSocket
window.testWebSocket.runAll();      // Run all tests
window.testWebSocket.quickTest();   // Quick connection test
```

## Best Practices

1. **Always use service-specific interfaces** - Don't use `webSocketService` directly unless monitoring connection status
2. **Handle connection errors gracefully** - Services may fail to connect initially
3. **Clean up subscriptions** - Unsubscribe from chats and status updates when components unmount
4. **Use timeouts** - Don't wait indefinitely for connections or responses
5. **Monitor connection status** - Show users when features are unavailable due to connection issues

## Migration from Legacy Services

If migrating from older WebSocket implementations:

1. Replace `WebSocketService` imports with specific services (`chatService`, `runnerService`)
2. Update callback structure to match new interfaces
3. Use `webSocketService` for connection monitoring instead of service-specific connection status
4. Remove duplicate connection management - services share the same connection

See `websocket-migration-guide.md` for detailed migration instructions.