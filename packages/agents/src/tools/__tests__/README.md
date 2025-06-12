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
- `fetch.test.ts` - Tests for URL fetching tool
- `terminal.test.ts` - Tests for terminal command execution tool
- `grep.test.ts` - Tests for grep pattern search tool
- `thinking.test.ts` - Tests for thinking/problem-solving tool
- `init-git.test.ts` - Tests for git initialization tool

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

Run fetch tool tests:
```bash
bun test src/tools/__tests__/fetch.test.ts
```

Run terminal tool tests:
```bash
bun test src/tools/__tests__/terminal.test.ts
```

Run grep tool tests:
```bash
bun test src/tools/__tests__/grep.test.ts
```

Run thinking tool tests:
```bash
bun test src/tools/__tests__/thinking.test.ts
```

Run init-git tool tests:
```bash
bun test src/tools/__tests__/init-git.test.ts
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

## Fetch Tool Tests

The fetch tool tests include:

- **URL fetching**: Basic HTTP requests with various content types
- **HTML to Markdown conversion**: Automatic conversion of HTML content
- **Content pagination**: Handling large responses with truncation
- **Raw mode**: Option to return unprocessed HTML
- **Robots.txt compliance**: Checking site permissions before fetching
- **Error handling**: Network errors, timeouts, invalid URLs
- **Parameter validation**: Testing all input parameters and ranges

Note: Fetch tests use mocked HTTP responses to avoid network dependencies.

## Terminal Tool Tests

The terminal tool tests include:

- **Command execution**: Basic shell commands with various outputs
- **Exit code handling**: Success and failure scenarios
- **Output processing**: stdout, stderr, and combined output handling
- **Working directory**: Commands executed in specified directories
- **Output truncation**: Handling large command outputs
- **Error conditions**: Invalid commands, directories, and timeouts
- **Cross-platform**: Tests work on both Unix and Windows systems
- **Special characters**: Unicode and special character support in commands
- **File operations**: Creating, reading, and manipulating files
- **Environment handling**: Command execution with proper environment setup

Note: Terminal tests use real shell commands but are isolated in temporary directories.

## Grep Tool Tests

The grep tool tests include:

- **Pattern matching**: Basic text search with various patterns
- **Regular expressions**: Complex regex pattern support with proper escaping
- **Case sensitivity**: Case-insensitive and case-sensitive search modes
- **Fixed string matching**: Literal text search without regex interpretation
- **Context lines**: Before/after context line display around matches
- **Invert matching**: Finding lines that don't match the pattern
- **File filtering**: Search only files matching specific patterns (e.g., "*.txt")
- **Recursive search**: Deep directory traversal with pattern matching
- **Multiple files**: Concurrent search across multiple file paths
- **Result limiting**: Maximum match count limiting and result truncation
- **Line numbering**: Optional line number display in results
- **Match positions**: Highlighting match positions within lines
- **Unicode support**: Proper handling of international characters
- **Binary files**: Graceful handling of binary content
- **Large files**: Performance testing with large file content
- **Error handling**: Invalid regex patterns, missing files, permission errors

Note: Grep tests use the Bun file system APIs and handle various edge cases for robust pattern searching.

## Thinking Tool Tests

The thinking tool tests include:

- **Sequential thinking**: Basic thought progression with numbered steps
- **Revision handling**: Ability to revise and reconsider previous thoughts
- **Branching logic**: Exploring alternative approaches from previous thoughts
- **State management**: Maintaining context across multiple thought steps
- **Dynamic adjustment**: Changing total thought estimates as understanding evolves
- **Parameter validation**: Ensuring proper relationships between revision/branch parameters
- **Complex scenarios**: Multi-step problems with revisions and branches
- **Output formatting**: Visual thought representation with borders and context
- **JSON summaries**: Structured progress tracking and metadata
- **Unicode support**: Handling international characters and emojis in thoughts
- **Edge cases**: Very long thoughts, multiline content, and state persistence

Note: Thinking tests verify both the logical flow of problem-solving and the visual presentation of thoughts.

## Init-Git Tool Tests

The init-git tool tests include:

- **Git repository initialization**: Basic git init with isomorphic-git in .chara/history
- **Skip logic**: Avoiding re-initialization of existing repositories
- **Directory creation**: Creating .chara/history structure automatically
- **Working directory**: Using current directory when not specified
- **Default branch**: Using 'main' as default branch name
- **Error handling**: Invalid paths and permission errors
- **Concurrent initialization**: Handling multiple simultaneous init attempts
- **Deep paths**: Working with nested directory structures
- **Special characters**: Handling paths with special characters
- **File system integration**: Proper integration with Node.js fs module

Note: Init-git tests use real isomorphic-git operations but are isolated in temporary directories.

## Adding New Tests

When adding new tools:

1. Create a new test file following the naming convention
2. Import the test utilities
3. Use the standard test structure with setup/cleanup
4. Cover all major functionality and edge cases
5. Update the `index.test.ts` to include the new tool
6. Update this README if needed

## Tool Dependencies

Some tools require external dependencies:

- **init-git**: Requires `isomorphic-git` package for git operations
- **fetch**: Uses built-in `fetch` API for HTTP requests
- **terminal**: Uses Node.js `spawn` for shell command execution
- **grep**: Uses Node.js file system APIs for pattern searching

When adding tools with external dependencies, ensure they are properly mocked in tests or use real implementations in isolated environments.