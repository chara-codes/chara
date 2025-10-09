# Debug Mode for Message Parts

This directory contains debug functionality for inspecting message parts and their structure during development.

## Overview

The debug mode provides two main features:

1. **Individual Part Debug**: Each rendered part can show its source data with a toggle
2. **Message-level Debug**: Display all parts of a message with detailed information

## Environment Setup

Debug mode is controlled by the `VITE_DEBUG_PARTS` environment variable.

### Enabling Debug Mode

Create or update your `.env` file in the web package:

```bash
# Enable debug mode for message parts
VITE_DEBUG_PARTS=true
```

Other accepted values:
- `VITE_DEBUG_PARTS=1`
- `VITE_DEBUG_PARTS=yes`

**Important:** When debug mode is enabled, ALL parts are rendered including normally filtered parts like "step-start".

### Disabling Debug Mode

```bash
# Disable debug mode (or remove the variable entirely)
VITE_DEBUG_PARTS=false
```

## Features

### 1. Message-level Debug Panel

When debug mode is enabled, each message displays a debug panel at the top showing:

- Total number of parts in the message
- Number of visible parts (normal content parts)
- Number of step-start parts (normally filtered workflow markers)
- Message ID (if available)
- Expandable list of all parts with their properties

**Features:**
- 🔍 Subtle gray debug styling (low opacity, small size)
- 📊 Compact part count badges
- 🔍 Expandable source view for each part
- 🏷️ Minimal badges for different part types
- 🔧 Understated marking for step-start parts

### 2. Individual Part Debug

Each rendered part gets an additional debug component showing:

- Part index and type
- Tool call ID (if applicable)
- Toggle to show/hide the raw JSON source

**Features:**
- 📝 Formatted JSON display
- 🔢 Sequential part numbering
- 🎨 Color-coded type badges
- 📱 Collapsible source view

## Part Types and Colors

The debug interface uses color coding for different part types:

- **Text** (`text`): Blue
- **Reasoning** (`reasoning`): Purple  
- **Tool calls** (`tool-call`, `tool-result`): Green
- **Context** (`source-url`, `source-document`, `file`): Orange
- **Unknown types**: Gray
- **Step-start parts** (`step-start`): Gray with "workflow" label (subtle dashed border)

## Usage Examples

### Basic Development Workflow

1. Set `VITE_DEBUG_PARTS=true` in your environment
2. Start your development server
3. Navigate to any chat interface
4. Each message will now show subtle debug information
5. Click "Show" to see the complete message structure
6. Click "Show" on individual parts to inspect their data

### Debugging Tool Call Issues

When debugging tool call rendering:

1. Look for parts with `toolCallId` properties
2. Check the tool name extraction and routing
3. Verify the status mapping from `state`/`status` to component props
4. Inspect the arguments and result data structure
5. Check for any step-start parts that may affect the workflow

### Inspecting Message Structure

To understand how messages are composed:

1. Enable debug mode
2. Send a message with various content types
3. Expand the message debug panel
4. Review how different content gets structured into parts
5. Check for step-start parts to understand the workflow structure
6. Compare visible vs step-start part counts

## API Reference

### Debug Utilities

```typescript
import { isDebugMode, getDebugConfig } from '@chara-codes/design-system';

// Check if debug mode is enabled
const debugEnabled = isDebugMode();

// Get debug configuration
const config = getDebugConfig();
```

### Component Props

#### PartRenderer

```typescript
interface PartRendererProps {
  parts: Part[];
  isUser?: boolean;
  onReasoningToggle?: (index: number) => void;
  expandedReasoningIndex?: number;
  showDebug?: boolean; // Override global debug setting
}
```

#### DebugMessage

```typescript
interface DebugMessageProps {
  parts: Part[];
  messageId?: string;
}
```

#### DebugPart

```typescript
interface DebugPartProps {
  part: Part;
  index: number;
}
```

## Implementation Details

### Environment Variable Handling

The debug functionality uses Vite's environment variable system:

- Variables must be prefixed with `VITE_` to be accessible in the browser
- The `isDebugMode()` function checks for truthy values
- Debug state is determined at runtime, not build time

### Performance Considerations

- Debug components are only rendered when debug mode is enabled
- JSON serialization only occurs when debug panels are expanded
- No performance impact in production when `VITE_DEBUG_PARTS` is not set
- In debug mode, all parts are rendered (including step-start), which may increase rendering time

### Security Notes

- Debug mode should only be enabled in development environments
- Part data may contain sensitive information - use caution in shared environments
- The debug panels display raw JSON which could expose internal data structures

## Troubleshooting

### Debug Mode Not Working

1. Verify the environment variable is set correctly
2. Restart your development server after changing environment variables
3. Check browser console for any JavaScript errors
4. Ensure you're using the updated message bubble components
5. Look for subtle gray debug panels - they may be easy to miss due to low opacity

### Missing Part Data

1. Check that parts are being passed correctly to the PartRenderer
2. Verify the part structure matches the expected `Part` interface
3. In debug mode, no parts should be filtered - all should be visible
4. Check console for any serialization errors in debug panels
5. Look for step-start parts that indicate workflow transitions

### Styling Issues

1. Debug components use styled-components - ensure the theme provider is set up
2. Check for CSS conflicts with existing styles
3. Debug panels are intentionally subtle (low opacity) - increase opacity if visibility is an issue

## Contributing

When adding new part types or debug features:

1. Update the color mapping in `DebugMessage` component
2. Add appropriate badges and labels for new part properties
3. Test debug display with various part configurations
4. Update this documentation with new features