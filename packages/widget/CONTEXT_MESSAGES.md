# Automatic Context Inclusion Feature

This document describes the automatic context inclusion feature that sends messages with attached context (files, text, etc.) in a structured format whenever context items are available.

## Overview

The chat widget now automatically includes context attachments when the user has context items selected. This enables more sophisticated interactions where the AI can analyze files, images, and additional text context alongside the user's message without any additional user action required.

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
2. **MessageBubble**: Updated to render both string and array content
3. **ChatHistory**: Updated preview generation for new format

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

### Text Parts
- **User messages**: Rendered as plain text
- **AI messages**: Rendered as Markdown with syntax highlighting

### File Parts
- **Images**: Displayed as inline images
- **PDFs**: Shows "PDF file attached" indicator
- **Other files**: Shows file type indicator

## Usage Examples

### Basic Text with Context (Automatic)
```typescript
// User input: "Review this code"
// Context: Code snippet (automatically included)
// Result:
[
  { type: 'text', text: 'Review this code' },
  { type: 'text', text: 'Context: main.js\nfunction hello() { ... }' }
]
```

### File Analysis (Automatic)
```typescript
// User input: "Analyze this document"
// Context: PDF file (automatically included)
// Result:
[
  { type: 'text', text: 'Analyze this document' },
  { type: 'file', data: 'JVBERi0x...', mimeType: 'application/pdf' }
]
```

### Mixed Context (Automatic)
```typescript
// User input: "Compare these"
// Context: Text snippet + Image file (automatically included)
// Result:
[
  { type: 'text', text: 'Compare these' },
  { type: 'text', text: 'Context: Requirements\nUser must be able to...' },
  { type: 'file', data: 'iVBORw0K...', mimeType: 'image/png' }
]
```

## Backward Compatibility

- Existing string-based messages continue to work unchanged
- Legacy message format is automatically supported
- No breaking changes to existing functionality

## Future Enhancements

Potential improvements:
- Support for additional file types
- Compression for large file attachments
- Context item reordering
- Batch context operations
- Context templates
- Optional manual control over context inclusion