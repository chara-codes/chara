# Tool Components

This directory contains specialized components for displaying different types of tool calls in the UI.

## Components

### DiffBlock

The `DiffBlock` component is used to display file differences in a user-friendly format. It was created by renaming and enhancing the original `WriteFileBlock` component.

**Features:**
- Side-by-side diff view with line numbers
- Color-coded additions (green) and deletions (red)
- Collapsible content with limited/full view modes
- Streaming animation for real-time content generation
- File extension detection and display
- Statistics showing added/removed lines
- Built-in diff algorithm (LCS-based)

**Usage:**
```tsx
import { DiffBlock } from "./diff-block";

const toolCall = {
  name: "edit-file",
  status: "complete",
  arguments: {
    path: "src/components/Header.tsx",
    mode: "edit",
    content: "new file content"
  },
  result: {
    operation: "edited",
    diff: "- old line\n+ new line"
  }
};

<DiffBlock
  toolCall={toolCall}
  toolCallId="unique-id"
  isVisible={true}
  showLineNumbers={true}
  maxHeight={500}
/>
```

**Props:**
- `toolCall`: Tool call object containing arguments and results
  - `toolCall.arguments.path`: The file path to display
  - `toolCall.arguments.mode`: Edit mode ("edit", "create", "overwrite")
  - `toolCall.arguments.content`: New file content
  - `toolCall.result.operation`: The operation performed
  - `toolCall.result.diff`: Diff string (for edit operations)
  - `toolCall.status`: Tool call status ("generating", "complete", "error")
- `toolCallId`: Unique identifier for the tool call
- `isVisible`: Whether the component is visible
- `streamingSpeed`: Milliseconds between characters during streaming
- `showLineNumbers`: Whether to show line numbers
- `maxHeight`: Maximum height in pixels for limited view
- `diffMode`: "unified" or "split" (currently only unified is implemented)

### Integration with edit-file Tool

The `DiffBlock` is automatically used when the `tool-call-component` encounters an `edit-file` tool call. The component extracts the necessary data from the tool call object:

- For "edit" operations: Parses the diff string from `toolCall.result.diff`
- For "create" operations: Shows new file creation using `toolCall.arguments.content`
- For "overwrite" operations: Shows content replacement using `toolCall.arguments.content`

The component intelligently determines the operation type from `toolCall.result.operation` or falls back to `toolCall.arguments.mode`.

### WriteFileBlock (Legacy)

The original `WriteFileBlock` is still available for backwards compatibility but should be replaced with `DiffBlock` for new implementations.

### TerminalToolBlock

Displays terminal command execution with syntax highlighting and streaming output.

## Demo

A demo component `DiffBlockDemo` is available to test the component functionality with mock tool call objects:

```tsx
import { DiffBlockDemo } from "./diff-block-demo";

<DiffBlockDemo />
```

The demo shows examples of both edit and create operations with proper tool call object structure.

## Architecture

The tool components follow a consistent pattern:

1. **Specialized Routing**: The `tool-call-component` routes different tool types to appropriate display components
2. **Enhanced UX**: Instead of showing raw JSON, tools get custom interfaces
3. **Streaming Support**: Real-time content generation with visual feedback
4. **Responsive Design**: Adapts to different screen sizes and content lengths
5. **Accessibility**: Proper ARIA labels and keyboard navigation

## Development

When adding new tool components:

1. Create the component in this directory
2. Export it from `index.ts`
3. Add routing logic in `tool-call-component.tsx`
4. Follow the established patterns for styling and behavior
5. Include proper TypeScript types and error handling
6. Add demo/documentation as needed