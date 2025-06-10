# Automatic Context Inclusion Feature

This document describes the automatic context inclusion feature that sends messages with attached context (files, text, etc.) in a structured format whenever context items are available.

## Overview

The chat widget now automatically includes context attachments when the user has context items selected. This enables more sophisticated interactions where the AI can analyze files, images, and additional text context alongside the user's message without any additional user action required.

The UI displays multi-part messages by showing only the main message content, while context items are displayed in the existing "Using context:" section, providing a clean and intuitive interface without duplication.

## Message Format

The system now supports two message content formats:

### Legacy Format (String)
```typescript
{
  id: "msg-123",
  content: "Analyze this code for issues",
  isUser: true,
  // ... other properties
}
```

### New Multi-Part Format (Array)
```typescript
{
  id: "msg-123",
  content: [
    {
      type: 'text',
      text: 'Analyze the following PDF and generate a summary.',
    },
    {
      type: 'file',
      data: '...base64 encoded file data...',
      mimeType: 'application/pdf',
    },
  ],
  isUser: true,
  // ... other properties
}
```

## MessageContent Interface

```typescript
export interface MessageContent {
  type: 'text' | 'file'
  text?: string              // For text content
  data?: string             // For file content (base64 encoded)
  mimeType?: string         // MIME type for files
}
```

## User Interface

### Automatic Context Inclusion

When context items are available, they are automatically included with every message sent. No user action is required beyond adding the context items themselves.

Context items are automatically included when:
- One or more context items are selected/uploaded
- User sends any message

### Message Display Format

Multi-part messages are displayed by extracting only the main message content:

1. **Main Message Content**: Only the user's actual message text is displayed in the message bubble
2. **Context Items**: Continue to be displayed in the existing "Using context:" section below the message
3. **No Duplication**: Context items are not duplicated in the message content area

**Example Display:**
```
┌─────────────────────────────────────────┐
│ User                            3:45 PM │
│                                         │
│ Analyze this code for performance       │
│ issues                                  │
└─────────────────────────────────────────┘

Using context:
┌─────────────────────────────────────────┐
│ 📄 main.js                              │
│ function processData(arr) {             │
│   return arr.map(x => x * 2);           │
│ }                                       │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ 📄 requirements.pdf                     │
│ [PDF preview or indicator]              │
└─────────────────────────────────────────┘
```

### Supported Context Types

1. **Text Context**: Code snippets, documentation, notes
2. **File Context**: 
   - PDF documents (`application/pdf`)
   - Images (`image/png`, `image/jpeg`)
   - Text files (`text/plain`)
   - Other files (`application/octet-stream`)

## API Format

When context is included, the API receives messages in this format:

```typescript
{
  messages: [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Analyze the following PDF and generate a summary.',
        },
        {
          type: 'file',
          data: '...base64 encoded PDF data...',
          mimeType: 'application/pdf',
        },
      ],
    },
  ],
  model: 'selected-model',
}
```

## Implementation Details

### Store Changes

1. **`sendMessage` signature remains simple**:
   ```typescript
   sendMessage: (content: string) => Promise<void>
   ```

2. **Message content processing**:
   - When context items exist, automatically creates multi-part content
   - User input becomes the first text part
   - Context items are converted to additional parts
   - File context items include base64 data and MIME type detection

### Component Changes

1. **InputArea**: Automatically detects and includes context items
2. **MessageBubble**: Updated to render only the main message content (first text part)
3. **ChatHistory**: Updated preview generation to show only main message content (not concatenated context)

### Message Content Processing

The system now processes multi-part messages by:
- **Extracting Main Content**: Uses only the first text part for the message display
- **Context Display**: Relies on existing "Using context:" section for context items
- **Avoiding Duplication**: Context items are not rendered twice

This ensures the UI clearly shows the user's intent without duplicating context information.

### Context Item Conversion

```typescript
// File context items
if (item.type === 'file' && item.data) {
  return {
    type: 'file',
    data: typeof item.data === 'string' ? item.data : JSON.stringify(item.data),
    mimeType: detectMimeType(item.name), // Auto-detected from extension
  };
}

// Text context items  
return {
  type: 'text',
  text: `Context: ${item.name}\n${item.data}`,
};
```

## MIME Type Detection

The system automatically detects MIME types based on file extensions:

- `.pdf` → `application/pdf`
- `.png` → `image/png`
- `.jpg`, `.jpeg` → `image/jpeg`
- `.txt` → `text/plain`
- Others → `application/octet-stream`

## Rendering

### Main Message Content
- **User messages**: Main text rendered as plain text
- **AI messages**: Main text rendered as Markdown with syntax highlighting

### Context Display Integration
- **Uses Existing Section**: Context items continue to appear in the "Using context:" section
- **No Duplication**: Message content area shows only the main user message
- **Consistent Styling**: Context items retain their existing visual styling and behavior

### Visual Styling
- Main message content rendered with standard message styling
- Context items maintain existing appearance in "Using context:" section
- Clean separation between message intent and supporting materials

## Usage Examples

### Basic Text with Context (Automatic)
```typescript
// User input: "Review this code"
// Context: Code snippet (automatically included)
// API Format:
[
  { type: 'text', text: 'Review this code' },
  { type: 'text', text: 'Context: main.js\nfunction hello() { ... }' }
]

// UI Display:
// Message: "Review this code"
// Using context: Code snippet (existing section)
```

### File Analysis (Automatic)
```typescript
// User input: "Analyze this document"
// Context: PDF file (automatically included)
// API Format:
[
  { type: 'text', text: 'Analyze this document' },
  { type: 'file', data: 'JVBERi0x...', mimeType: 'application/pdf' }
]

// UI Display:
// Message: "Analyze this document"  
// Using context: PDF file (existing section)
```

### Mixed Context (Automatic)
```typescript
// User input: "Compare these"
// Context: Text snippet + Image file (automatically included)
// API Format:
[
  { type: 'text', text: 'Compare these' },
  { type: 'text', text: 'Context: Requirements\nUser must be able to...' },
  { type: 'file', data: 'iVBORw0K...', mimeType: 'image/png' }
]

// UI Display:
// Message: "Compare these"
// Using context:
//   - Text requirements (existing section)
//   - Image preview (existing section)
```

## Backward Compatibility

- Existing string-based messages continue to work unchanged
- Legacy message format is automatically supported
- No breaking changes to existing functionality

## UI Benefits

1. **Clear Message Intent**: Users see their exact message without context pollution
2. **No Duplication**: Context items appear only in the existing "Using context:" section
3. **Scannable Interface**: Clean message bubbles with context displayed separately below
4. **Consistent Experience**: Maintains existing context display behavior
5. **Simplified UI**: No additional context sections in message content area

## Future Enhancements

Potential improvements:
- Support for additional file types
- Compression for large file attachments
- Context item reordering
- Batch context operations
- Context templates
- Optional manual control over context inclusion
- Collapsible context sections for long conversations
- Context item thumbnails and previews