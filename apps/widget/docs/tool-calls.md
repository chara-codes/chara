# Tool Calls Feature

## Overview

The message bubble component now supports displaying tool calls made by AI agents. Tool calls are function invocations that the AI makes to interact with external tools or APIs.

## UI Display

Tool calls appear in AI messages as expandable sections showing:

- **Tool Call Header**: Tool name with status indicator
- **Arguments**: JSON-formatted input parameters
- **Result**: Output or error information

## Data Structure

```typescript
interface ToolCall {
  id: string
  name: string
  arguments: Record<string, unknown>
  status: "pending" | "in-progress" | "success" | "error"
  result?: ToolResult
  timestamp: string
}

interface ToolResult {
  content?: string
  data?: unknown
  error?: string
}
```

## Status Indicators

- **Pending**: Gray - Tool call queued
- **In Progress**: Orange - Currently executing
- **Success**: Green - Completed successfully
- **Error**: Red - Failed execution

## Example Usage

```typescript
const message: Message = {
  id: "msg-1",
  content: "I'll check the weather for you.",
  isUser: false,
  toolCalls: [
    {
      id: "call-1",
      name: "get_weather",
      arguments: {
        location: "New York",
        units: "celsius"
      },
      status: "success",
      result: {
        content: "Temperature: 22°C, Sunny"
      },
      timestamp: "2024-01-01T12:00:00Z"
    }
  ]
}
```

## Integration

Tool calls are automatically handled through the streaming service and displayed in the message bubble without additional configuration. The chat store processes incoming tool call data and updates the message state accordingly.