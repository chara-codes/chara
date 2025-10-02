# Server Services

This directory contains service classes that encapsulate business logic for the server.

## File Services

### FileListingService

Scans the current working directory and provides a list of files and directories, respecting `.gitignore` rules.

**Features:**
- Recursive directory scanning with configurable depth
- GitIgnore integration using the `ignore` package
- Optional inclusion of hidden files
- Returns file metadata (size, last modified date)
- Proper error handling for file system operations

**Usage:**
```typescript
import { FileListingService } from './services';

const service = new FileListingService(process.cwd());
const result = await service.listFiles({
  maxDepth: 3,
  includeHidden: false,
});

console.log(`Found ${result.totalCount} files`);
console.log(`Applied ${result.gitIgnoreRules.length} gitignore rules`);
```

### FileContentService

Reads file content by path with proper validation and encoding detection.

**Features:**
- Path validation to ensure files are within working directory
- Binary file detection
- MIME type detection based on file extension
- File size limits (10MB max)
- Proper error handling with specific error messages
- Support for both text and binary files (base64 encoding for binary)

**Usage:**
```typescript
import { FileContentService } from './services';

const service = new FileContentService(process.cwd());
const result = await service.getFileContent('package.json');

console.log(`File size: ${result.size} bytes`);
console.log(`MIME type: ${result.mimeType}`);
console.log(`Is binary: ${result.isBinary}`);
console.log(`Content: ${result.content}`);
```

## Error Handling

Both services implement comprehensive error handling:

- **FileListingService**: Handles directory read errors, permission errors, and missing .gitignore files
- **FileContentService**: Handles file not found, permission denied, file too large, and invalid path errors

All errors are logged using the server logger for debugging purposes.

## Testing

Manual tests are available in `__tests__/fileServices.manual.test.ts`. Run with:

```bash
bun test src/services/__tests__/fileServices.manual.test.ts
```

The tests verify:
- File listing functionality
- GitIgnore rule application
- File content reading
- MIME type detection
- Path validation
- Error handling
