# Message Bubble Parts System

This directory contains the refactored message bubble parts system that renders individual UIMessage parts using dedicated components for each part type.

## Overview

The parts system replaces the previous monolithic message rendering approach with a modular, type-specific rendering system that properly handles the AI SDK's UIMessage format.

## Architecture

### Core Components

- **`PartRenderer`**: The main orchestrator that routes parts to appropriate components
- **`TextPart`**: Renders text content with markdown support
- **`ReasoningPart`**: Renders AI reasoning/thinking processes
- **`ToolCallPart`**: Renders tool calls and their results
- **`ContextPart`**: Renders context sources (URLs, documents, files)

### Design Principles

1. **Type Safety**: Each part component is strongly typed for its specific part type
2. **Modularity**: Each part type has its own dedicated component
3. **Consistency**: Shared styling patterns across all part types
4. **Expandability**: Easy to add new part types without modifying existing code

## Usage

### Basic Usage

```tsx
import { PartRenderer } from './parts';

const MyComponent = ({ message }) => {
  return (
    <PartRenderer
      parts={message.parts}
      isUser={message.role === 'user'}
    />
  );
};
```

### With Reasoning Control

```tsx
import { PartRenderer } from './parts';

const [expandedReasoningIndex, setExpandedReasoningIndex] = useState();

const handleReasoningToggle = (index) => {
  setExpandedReasoningIndex(prev => prev === index ? undefined : index);
};

return (
  <PartRenderer
    parts={message.parts}
    isUser={false}
    onReasoningToggle={handleReasoningToggle}
    expandedReasoningIndex={expandedReasoningIndex}
  />
);
```

## Part Types

### Text Parts
```typescript
{
  type: "text",
  text: "Hello, world!"
}
```
- Renders plain text for user messages
- Renders markdown for assistant messages
- Automatically cleans thinking tags from content

### Reasoning Parts
```typescript
{
  type: "reasoning",
  text: "Let me think about this...",
  state: "streaming" | "complete" | "pending"
}
```
- Collapsible thinking sections
- Auto-scroll during streaming
- Visual indicators for different states

### Tool Call Parts
```typescript
{
  type: "tool-call",
  toolName: "search",
  toolCallId: "call_123",
  input: { query: "example" },
  state: "success"
}
```
- Expandable tool call details
- Formatted JSON input/output
- Status indicators (pending, success, error)

### Tool Result Parts
```typescript
{
  type: "tool-result",
  toolName: "search",
  toolCallId: "call_123",
  output: { results: [...] },
  state: "success"
}
```
- Renders tool execution results
- Error handling and display
- Formatted output based on type

### Context Parts
```typescript
{
  type: "source-url",
  title: "Example Page",
  url: "https://example.com",
  sourceId: "src_123"
}
```
Supported context types:
- `source-url`: Web page references
- `source-document`: Document references
- `file`: File attachments

## Styling

All parts use a consistent color-coded system:
- **Text**: Default theme colors
- **Reasoning**: Purple accent (`#7c3aed`)
- **Tools**: Green accent (`#059669`)
- **Context**: Blue accent (`#2563eb`)

### Common Patterns

- Expandable sections with chevron icons
- Consistent padding and spacing
- Hover states and transitions
- Color-coded headers and icons

## Extending the System

### Adding a New Part Type

1. Create a new component file (e.g., `custom-part.tsx`)
2. Define the part props interface
3. Implement the component with consistent styling
4. Add the case to `PartRenderer`
5. Export from `index.ts`

Example:
```tsx
// custom-part.tsx
export interface CustomPartProps {
  customData: string;
  state?: string;
}

const CustomPart: React.FC<CustomPartProps> = ({ customData, state }) => {
  return (
    <div style={{ /* consistent styling */ }}>
      {customData}
    </div>
  );
};

export default CustomPart;
```

```tsx
// In part-renderer.tsx
case "custom":
  return (
    <CustomPart
      key={key}
      customData={part.customData}
      state={part.state}
    />
  );
```

## Migration from Legacy Format

The system includes automatic fallback handling for legacy message formats:

- `content` field → `text` part
- `thinkingContent` prop → `reasoning` part  
- `contextItems` prop → context parts
- `toolCalls` prop → tool call/result parts

This ensures backward compatibility during the transition period.

## Performance Considerations

- Components use `React.memo()` where appropriate
- Expansion states are managed efficiently
- Large content is truncated with preview limits
- Auto-scrolling is optimized with intervals

## Testing

Each part component should be tested for:
- Proper rendering with valid data
- Graceful handling of missing/invalid data
- Expansion/collapse functionality
- Accessibility (ARIA labels, keyboard navigation)
- Responsive design

## Future Enhancements

Planned improvements:
- Syntax highlighting for code parts
- Image/media part support
- Interactive tool result rendering
- Real-time collaboration indicators
- Accessibility improvements