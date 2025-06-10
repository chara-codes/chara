# File Content Reading Examples

This document demonstrates the new file content reading feature for the widget's file input component.

## Overview

When users select files using the `FileInput` component, the system now:
1. Reads the file content automatically
2. Detects the MIME type
3. Stores both content and metadata in context items
4. Displays file information in tooltips and previews

## Supported File Types

The system supports reading content from various file types:

### Text Files
- `.txt` - Plain text files
- `.md`, `.markdown` - Markdown files
- `.html`, `.htm` - HTML files
- `.css` - CSS stylesheets
- `.js`, `.jsx` - JavaScript files
- `.ts`, `.tsx` - TypeScript files
- `.json` - JSON data files
- `.xml` - XML files
- `.csv` - CSV files
- `.yaml`, `.yml` - YAML files
- `.toml` - TOML files

### Programming Languages
- `.py` - Python
- `.java` - Java
- `.c`, `.cpp`, `.h`, `.hpp` - C/C++
- `.cs` - C#
- `.php` - PHP
- `.rb` - Ruby
- `.go` - Go
- `.rs` - Rust
- `.swift` - Swift
- `.kt` - Kotlin
- `.scala` - Scala
- `.sql` - SQL
- `.sh`, `.bash`, `.zsh`, `.fish` - Shell scripts

### Binary Files
Binary files are also supported but their content is stored as base64 encoded data:
- Images (`.jpg`, `.png`, `.gif`, `.svg`, etc.)
- Documents (`.pdf`, `.doc`, `.docx`, etc.)
- Archives (`.zip`, `.tar`, `.gz`, etc.)

## How It Works

### 1. File Selection
When a user selects a file through the `FileInput` component:

```typescript
const handleFileSelect = async (file: File) => {
  // Check if file type is supported
  if (!isSupportedFileType(file)) {
    // Add file without content
    onAddContext({
      name: file.name,
      type: "File",
      data: file,
      mimeType: file.type || 'application/octet-stream',
    });
    return;
  }

  // Read file content
  const { content, mimeType } = await readFileContent(file);
  
  onAddContext({
    name: file.name,
    type: "File",
    data: file,
    content: content,
    mimeType: mimeType,
  });
};
```

### 2. Content Processing
The `readFileContent` utility function:
- Detects if the file is binary or text based on MIME type
- For text files: reads content as UTF-8 string
- For binary files: converts to base64 encoded string
- Determines MIME type from file extension if not provided

### 3. Context Item Storage
Context items now include additional fields:

```typescript
interface ContextItem {
  id: string;
  name: string;
  type: string;
  data?: unknown;
  content?: string; // File content (text or base64 for binary files)
  mimeType?: string; // MIME type of the file
}
```

### 4. Display and Preview
- **Context Panel**: Shows file size next to file name
- **Tooltip**: Displays file information on hover including type, size, and content status
- **Message Bubble**: When expanded, shows actual file content with syntax highlighting context

## Example Usage

### Text File Content
When a user uploads a `package.json` file:
```json
{
  "name": "my-project",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.0.0"
  }
}
```

The context item will contain:
- `name`: "package.json"
- `type`: "File"
- `mimeType`: "application/json"
- `content`: The actual JSON content as a string
- `data`: The original File object

### Binary File Content
When a user uploads an image file:
- `name`: "screenshot.png"
- `type`: "File"
- `mimeType`: "image/png"
- `content`: Base64 encoded image data
- `data`: The original File object

## Error Handling

The system gracefully handles various error scenarios:

1. **Unsupported file types**: Files are still added to context but without content
2. **Read errors**: Falls back to adding file metadata only
3. **Large files**: Content is truncated in previews but full content is available
4. **Invalid MIME types**: Falls back to extension-based detection

## Preview Examples

### Image File Tooltip
When hovering over an uploaded image file:
- Shows file metadata (name, type, size)
- Displays a small thumbnail of the actual image
- Falls back to error message if image can't be loaded

### Text File Tooltip
When hovering over a text file:
- Shows file metadata
- Displays first 30 characters of content with "..."
- Preserves formatting for code files

### JSON File Tooltip
When hovering over a JSON file:
- Shows file metadata
- Displays formatted JSON with proper indentation
- Truncates large JSON objects gracefully

## UI Enhancements

### Context Panel Tooltips
Hover over file context items to see:
- File name
- MIME type
- File size
- Content availability status
- **Content Preview**:
  - **Images**: Small thumbnail preview (max 120x80px)
  - **Text files**: First 30 characters with ellipsis
  - **JSON files**: Formatted JSON preview
  - **SVG files**: SVG markup preview

### File Size Display
File sizes are displayed in human-readable format:
- 1.2 KB
- 500 B
- 2.5 MB

### Content Previews
In message bubbles and tooltips, file content is displayed with:
- Syntax highlighting context based on file type
- Truncation for large files
- Special handling for binary files
- **Interactive tooltips** with content previews:
  - Image files show actual image thumbnails
  - Text files show formatted content snippets
  - JSON files display properly formatted JSON
  - Error handling for corrupted or unsupported content

## Utility Functions

### `readFileContent(file: File)`
Reads file content and returns:
```typescript
{
  content: string;
  mimeType: string;
  isBinary: boolean;
}
```

### `isSupportedFileType(file: File)`
Checks if a file type is supported for content reading.

### `formatFileSize(bytes: number)`
Formats file size in human-readable format.

### `getMimeTypeFromExtension(filename: string)`
Determines MIME type based on file extension.

## Migration Notes

- Existing context items without `content` and `mimeType` fields will continue to work
- The feature is backward compatible with existing implementations
- File data is still preserved in the `data` field for legacy compatibility