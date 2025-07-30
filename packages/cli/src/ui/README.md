# Chara CLI UI

A modular command-line interface built with [Ink](https://github.com/vadimdemedes/ink) that provides an interactive chat-like experience for the Chara development assistant.

## Overview

The UI is designed based on a wireframe layout with the following sections:

```
┌─────────────┬─────────────────────┬─────────────────┐
│             │                     │ Dev Server Info │
│             │                     ├─────────────────┤
│ Chats       │  Conversation       │                 │
│ History     │  Views              │ Server Logs     │
│             │                     │                 │
│             │                     │                 │
└─────────────┼─────────────────────┴─────────────────┤
              │ Text Input                            │
              └───────────────────────────────────────┘
```

## Components

### Layout Components

- **`Layout`** - Main layout container that orchestrates all sections
- **`ChatsHistory`** - Left sidebar showing conversation history
- **`ConversationViews`** - Main center area displaying chat messages
- **`DevServerInfo`** - Top right panel showing development server status
- **`ServerLogs`** - Bottom right panel displaying server logs
- **`TextInput`** - Bottom input area for user messages

### Component Features

#### ChatsHistory
- Shows list of previous conversations
- Highlights active conversation
- Displays conversation count
- Truncates long titles with ellipsis

#### ConversationViews
- Displays chat messages with timestamps
- Different styling for user vs assistant messages
- Shows loading state when assistant is typing
- Handles empty state

#### DevServerInfo
- Shows server status (running/stopped/error)
- Displays port, URL, uptime, and version
- Color-coded status indicators

#### ServerLogs
- Real-time log display with different log levels
- Color-coded log entries (info, warn, error, debug)
- Icons for different log types
- Pagination support

#### TextInput
- Multi-line text input simulation
- Status bar showing current folder and model
- Helpful tips display
- Keyboard shortcuts

## Usage

### Basic Usage

```typescript
import { startUI } from './ui/index.js';

const ui = startUI({
  onMessageSubmit: (message: string) => {
    console.log('User message:', message);
    // Handle user input
  },
  onChatSelect: (chatId: string) => {
    console.log('Selected chat:', chatId);
    // Handle chat selection
  },
  currentFolder: './my-project',
  currentModel: 'gpt-4-turbo'
});

// Update UI state
ui.rerender({
  isLoading: true,
  // ... other options
});

// Cleanup
ui.unmount();
```

### Advanced Usage

```typescript
import { Layout, ChatsHistory, ConversationViews } from './ui/components/index.js';
import { render } from 'ink';

// Use individual components
const app = render(
  <Layout
    onMessageSubmit={handleMessage}
    onChatSelect={handleChatSelect}
    isLoading={false}
    currentFolder="./project"
    currentModel="gpt-4"
  />
);
```

### Component Props

#### UIOptions Interface

```typescript
interface UIOptions {
  onMessageSubmit?: (message: string) => void;
  onChatSelect?: (chatId: string) => void;
  isLoading?: boolean;
  currentFolder?: string;
  currentModel?: string;
}
```

## Running the Demo

To test the UI components:

```bash
# Run the interactive demo
bun run demo:ui

# Or run directly
bun ./src/ui/demo.ts
```

The demo includes:
- Interactive message simulation
- Realistic chat responses
- Loading states
- Server status simulation
- Log entries

## Development

### File Structure

```
src/ui/
├── components/
│   ├── ChatsHistory.tsx      # Chat list sidebar
│   ├── ConversationViews.tsx # Main chat area
│   ├── DevServerInfo.tsx     # Server status panel
│   ├── ServerLogs.tsx        # Logs panel
│   ├── TextInput.tsx         # Input area
│   ├── Layout.tsx            # Main layout
│   └── index.ts              # Component exports
├── index.tsx                 # Main UI entry point
├── demo.ts                   # Demo/testing script
└── README.md                 # This file
```

### Building

The UI components are built with TypeScript and use modern React JSX transform:

```bash
# Type check
bun run tsc --noEmit

# Build the CLI
bun run build
```

### Requirements

- **Node.js 18+** or **Bun**
- **React 19+**
- **Ink 6+**
- **TypeScript 5+**

## Features

### Responsive Design
- Flexible layout that adapts to terminal size
- Proper text wrapping and truncation
- Scrollable content areas

### Interactive Elements
- Keyboard navigation support
- Real-time updates
- Loading states and animations

### Accessibility
- Color-coded information
- Clear visual hierarchy
- Helpful status indicators

### Error Handling
- Graceful fallbacks for missing data
- Non-blocking error states
- User-friendly error messages

## Integration

### With Chara CLI

The UI integrates with the main Chara CLI through:

1. **Message Handling** - User input processing
2. **State Management** - Loading states and updates
3. **Server Integration** - Real-time server status
4. **Log Streaming** - Live server logs display

### Event System

```typescript
// Listen for UI events
ui.on('message', (message) => {
  // Process user message
});

ui.on('chat-select', (chatId) => {
  // Load selected chat
});
```

## Styling

The UI uses Ink's built-in styling with:
- **Colors**: Blue (user), Green (assistant), Yellow (warnings), Red (errors)
- **Typography**: Bold for headers, dim for secondary text
- **Layout**: Flexbox-based responsive design
- **Borders**: Single-line borders for panels

## Performance

- **Efficient Rendering** - Only updates changed components
- **Memory Management** - Proper cleanup on unmount
- **Log Pagination** - Limits displayed logs to prevent memory issues
- **Debounced Updates** - Smooth real-time updates

## Troubleshooting

### Common Issues

1. **Raw Mode Error**: When running in non-interactive terminals
   - Solution: Run in a proper terminal environment

2. **Module Resolution**: TypeScript import errors
   - Solution: Ensure `moduleResolution: "node16"` in tsconfig.json

3. **JSX Transform**: React JSX compilation issues
   - Solution: Use `jsx: "react-jsx"` in TypeScript config

### Debug Mode

Enable debug output:

```bash
DEBUG=chara:ui bun run demo:ui
```

## Contributing

When adding new components:

1. Follow the existing file structure
2. Use TypeScript interfaces for props
3. Include proper error handling
4. Add to the component index file
5. Update this README

## License

Apache-2.0 - See the main project license file.