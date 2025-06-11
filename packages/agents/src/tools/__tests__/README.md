# Tools Tests

This directory contains comprehensive tests for all filesystem tools in the agents package.

## Test Structure

Each tool has its own test file following the naming convention `{tool-name}.test.ts`:

- `current-dir.test.ts` - Tests for current directory tool
- `read-file.test.ts` - Tests for file reading tool
- `write-file.test.ts` - Tests for file writing tool
- `read-multiple-files.test.ts` - Tests for multiple file reading tool
- `edit-file.test.ts` - Tests for file editing tool
- `create-directory.test.ts` - Tests for directory creation tool
- `list-directory.test.ts` - Tests for directory listing tool
- `directory-tree.test.ts` - Tests for recursive directory tree tool
- `move-file.test.ts` - Tests for file/directory moving tool
- `search-files.test.ts` - Tests for file search tool
- `get-file-info.test.ts` - Tests for file metadata tool

## Test Utilities

- `test-utils.ts` - Shared utilities for creating temporary test filesystems
- `index.test.ts` - Integration tests for the tools index

## Running Tests

Run all tests:
```bash
bun test
```

Run tests in watch mode:
```bash
bun run test:watch
```

Run tests with coverage:
```bash
bun run test:coverage
```

Run specific test file:
```bash
bun test src/tools/__tests__/read-file.test.ts
```

## Test Framework

Tests use Bun's built-in test runner with the following features:

- **Test isolation**: Each test gets its own temporary filesystem
- **Async support**: All file operations are properly awaited
- **Error testing**: Tests verify proper error handling
- **Edge cases**: Tests cover empty files, large files, special characters, etc.
- **Concurrent testing**: Tests verify thread safety where applicable

## Test Utilities (TestFileSystem)

The `TestFileSystem` utility class provides:

- `setup()` - Creates a temporary directory for the test
- `cleanup()` - Removes the temporary directory after the test
- `createFile(path, content)` - Creates a test file with content
- `createDir(path)` - Creates a test directory
- `getPath(relativePath)` - Gets absolute path within test directory
- `fileExists(path)` - Checks if a file exists
- `readFile(path)` - Reads a file's content

## Test Coverage

The tests cover:

- ✅ Happy path scenarios
- ✅ Error conditions
- ✅ Edge cases (empty files, large files, special characters)
- ✅ Concurrent operations
- ✅ File system boundaries
- ✅ Permission handling
- ✅ Unicode and special character support
- ✅ Tool metadata validation

## Test Patterns

Each test file follows this structure:

```typescript
import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { toolName } from "../tool-name";
import { createTestFS } from "./test-utils";

describe("toolName tool", () => {
  const testFS = createTestFS();

  beforeEach(async () => {
    await testFS.setup();
  });

  afterEach(async () => {
    await testFS.cleanup();
  });

  test("should handle basic operation", async () => {
    // Test implementation
  });
});
```

## Adding New Tests

When adding new tools:

1. Create a new test file following the naming convention
2. Import the test utilities
3. Use the standard test structure with setup/cleanup
4. Cover all major functionality and edge cases
5. Update the `index.test.ts` to include the new tool
6. Update this README if needed