# Context Panel Preview Examples

This document provides visual examples of how the enhanced context panel tooltips work with different file types.

## Image File Example

When a user uploads an image file like `screenshot.png`:

**File Information:**
- Name: `screenshot.png`
- Type: `image/png`
- Size: `245 KB`
- Content: Base64 encoded image data

**Tooltip Display:**
```
File: screenshot.png
Type: image/png
Size: 245 KB
Content: Loaded

Preview
[Image thumbnail: 120x80px preview of the actual image]
```

## Text File Example

When a user uploads a text file like `README.md`:

**File Information:**
- Name: `README.md`
- Type: `text/markdown`
- Size: `1.2 KB`
- Content: Raw markdown text

**Tooltip Display:**
```
File: README.md
Type: text/markdown
Size: 1.2 KB
Content: Loaded

Preview
# My Project

This is a sam...
```

## JSON File Example

When a user uploads a configuration file like `package.json`:

**File Information:**
- Name: `package.json`
- Type: `application/json`
- Size: `892 B`
- Content: Raw JSON string

**Tooltip Display:**
```
File: package.json
Type: application/json
Size: 892 B
Content: Loaded

Preview
{
  "name": "my-project",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.0.0"
  }
}...
```

## JavaScript File Example

When a user uploads a code file like `utils.js`:

**File Information:**
- Name: `utils.js`
- Type: `application/javascript`
- Size: `2.1 KB`
- Content: Raw JavaScript code

**Tooltip Display:**
```
File: utils.js
Type: application/javascript
Size: 2.1 KB
Content: Loaded

Preview
function formatDate(date) {
  ret...
```

## SVG File Example

When a user uploads an SVG file like `icon.svg`:

**File Information:**
- Name: `icon.svg`
- Type: `image/svg+xml`
- Size: `1.5 KB`
- Content: Raw SVG markup

**Tooltip Display:**
```
File: icon.svg
Type: image/svg+xml
Size: 1.5 KB
Content: Loaded

Preview
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://...
```

## Binary File Example

When a user uploads a binary file like `document.pdf`:

**File Information:**
- Name: `document.pdf`
- Type: `application/pdf`
- Size: `156 KB`
- Content: Base64 encoded binary data

**Tooltip Display:**
```
File: document.pdf
Type: application/pdf
Size: 156 KB
Content: Loaded

Preview
Binary file content (159744 bytes base64 encoded)
```

## Error Handling Examples

### Corrupted Image File

When an image file is corrupted or can't be displayed:

**Tooltip Display:**
```
File: corrupted.jpg
Type: image/jpeg
Size: 45 KB
Content: Loaded

Preview
Preview unavailable
```

### Unsupported File Type

When a file type doesn't support content reading:

**Tooltip Display:**
```
File: archive.zip
Type: application/zip
Size: 2.3 MB
Content: Available

(No preview section shown)
```

## Interactive Behavior

### Hover States
- **Default**: Context item shows file name and size
- **Hover**: Tooltip appears with detailed information and preview
- **Long hover**: Tooltip remains visible for detailed inspection

### Visual Feedback
- **Loading**: While file content is being read
- **Success**: Green indicator when content is loaded
- **Error**: Red indicator when content can't be read
- **Fallback**: Gray indicator for unsupported files

## Implementation Notes

### Preview Limitations
- **Text files**: Limited to 30 characters
- **JSON files**: Pretty-printed up to 100 characters
- **Images**: Scaled to max 120x80px
- **SVG files**: Shows opening tag with attributes

### Performance Considerations
- Previews are generated on-demand when tooltip is shown
- Image thumbnails are created from base64 data
- Large files are truncated to prevent memory issues
- Error boundaries prevent crashes from corrupted content

### Accessibility
- Alt text provided for image previews
- Screen reader friendly file information
- Keyboard navigation support for tooltips
- High contrast colors for readability