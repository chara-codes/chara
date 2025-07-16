# Agent Tools Configuration

This directory contains tools optimized for different agents in the Chara system. Tools have been organized to avoid redundancy and provide each agent with only the capabilities they need.

## Tool Categories

### Chat Tools (`chat-tools.ts`)
Tools for the interactive chat agent focused on development tasks:

- **File Operations**: `read-file`, `edit-file`
- **File System Management**: `file-system` (stats, info, env operations), `find` (pattern-based searching), `move-file`
- **Search & Analysis**: `grep` (content search), `find` (file/directory search)
- **Code Quality**: `examination`
- **External Resources**: `fetch`
- **System Integration**: `terminal`
- **Meta Tools**: `thinking`

### Init Tools (`init-tools.ts`)
Tools for the project initialization agent focused on analysis and configuration:

- **File System Management**: `file-system` (stats, info, env operations), `find` (file/directory search)
- **File Reading**: `read-file`
- **Search**: `grep` (content search), `find` (file/directory search)
- **Code Quality**: `examination`
- **Meta Tools**: `thinking`

## Removed Redundancies

### Eliminated Tools
- **`write-file`**: Removed as file creation/modification is handled by `edit-file`
- **`read-multiple-files`**: Functionality can be achieved by multiple `read-file` calls
- **`list-directory`**, **`directory-tree`**, **`current-dir`**, **`create-directory`**: Replaced by the unified `file-system` tool
- **`get-file-info`**: Merged into `file-system` tool as the `info` action
- **`env-info`**: Merged into `file-system` tool as the `env` action
- **`directory`**: Renamed and expanded with find functionality moved to dedicated `find` tool
- **Development-only tools from init**: Removed `terminal` and other development tools from init agent since it only needs to analyze, not modify projects

### Refactored Tools
- **`file-system`**: Focused file system management tool that handles directory operations (`stats`), file information (`info`), and environment analysis (`env`)
- **`find`**: Dedicated file and directory search tool with comprehensive glob pattern support, enhanced `.gitignore` integration via `find-up`, and advanced safety features

### Tool Consolidation Benefits
- **Single interface** for all file system operations instead of multiple separate tools
- **Consistent API** across directory, file info, and environment operations
- **Reduced tool count** while maintaining all functionality
- **Better organization** with logical grouping of related operations

### Tool Comparison: Why grep over simple file finding?

| Feature | grep | directory find |
|---------|------|---------|
| Pattern matching | Regex support | Glob patterns |
| Content search | ✅ Can search inside files | ❌ Filename only |
| Context lines | ✅ Before/after context | ❌ No context |
| Filtering | ✅ Advanced filters | ✅ Glob exclude patterns |
| Performance | ✅ Optimized for large codebases | ✅ Globby optimized |

## Usage

### In Chat Agent
```typescript
import { chatTools } from "../tools/chat-tools";

// Use in streamText
tools: {
  ...chatTools,
}
```

### In Init Agent
```typescript
import { initTools } from "../tools/init-tools";

// Use in streamText
tools: {
  ...initTools,
}
```

## Optimization Results

The tool optimization achieved significant improvements:

- **Original tools**: 19 tools (all agents used everything)
- **Chat agent tools**: 9 tools (streamlined with focused `file-system` and dedicated `find` tools)
- **Init agent tools**: 5 tools (minimal set for project analysis)
- **Modern tools**: 9 tools (streamlined set using only essential tools)

### Refactored Tool Benefits
- **Separation of concerns**: File system operations (`file-system`) and search functionality (`find`) are now distinct
- **Enhanced search capabilities**: Dedicated `find` tool with advanced glob patterns, timeout protection, and memory optimization
- **Improved `.gitignore` support**: Scoped to search directory and parent only, preventing irrelevant parent directory rules
- **Better error handling**: Each tool provides focused error messages and suggestions
- **Type safety improvements**: Fixed all TypeScript warnings and errors
- **Performance optimization**: Streamlined implementations with reduced memory footprint
- **Accurate pattern matching**: Fixed issues with gitignore filtering that was incorrectly excluding matching files

### Key Improvements
1. **Better separation of concerns**: Split file system operations and search into focused tools
2. **Enhanced search capabilities**: Dedicated `find` tool with advanced pattern matching and safety features
3. **Improved type safety**: Fixed all TypeScript errors and warnings
4. **Agent-specific optimization**: Each agent only gets tools it actually needs
5. **Security improvement**: System tools like `terminal` restricted to chat agent only
6. **Performance boost**: Optimized implementations with better memory management

### Tools Removed from Specific Agents
- **From chat agent**: `write-file`, `read-multiple-files`, `get-file-info`, `env-info`, legacy directory tools
- **From init agent**: `terminal`, `move-file`, `fetch`, `get-file-info`, `env-info`, `write-file`, `read-multiple-files` (development-only tools)
- **Globally removed**: `write-file`, `read-multiple-files`, `list-directory`, `directory-tree`, `current-dir`, `create-directory`, `get-file-info`, `env-info`

### Tools Replaced by Refactored Tools
- **`get-file-info`**: Now `file-system` with `action: "info"`
- **`env-info`**: Now `file-system` with `action: "env"`
- **Directory stats**: Now `file-system` with `action: "stats"`
- **File finding**: Now dedicated `find` tool with enhanced glob patterns
- **Legacy directory operations**: Removed (use `mkdir` tool for directory creation)

## Tool Descriptions

### Core File Operations
- **`read-file`**: Read single file content
- **`edit-file`**: Create new files or make precise line-based edits to existing files

### File System Operations
- **`file-system`**: **FOCUSED FILE SYSTEM TOOL** - Core file system operations:
  - `stats`: Calculate directory statistics (file count, sizes, etc.)
  - `info`: Get detailed file/directory metadata (size, timestamps, permissions)
  - `env`: Get comprehensive environment and project configuration information
- **`find`**: **DEDICATED SEARCH TOOL** - Advanced file and directory searching:
  - Comprehensive glob pattern support (`**/*.js`, `*.txt`, `**/test/**`)
  - Pipe-separated patterns for multiple searches (`*.js|*.ts`)
  - Scoped `.gitignore` integration (search directory and parent only)
  - Pattern complexity validation and safety checks
  - Timeout protection for long-running searches
  - Memory usage optimization with automatic exclusions
  - Accurate pattern matching that respects specified file patterns
- **`move-file`**: Move/rename files and directories (chat agent only)
- **`mkdir`**: Create directories with recursive parent creation

### Search & Analysis
- **`grep`**: Advanced pattern search with regex, context, and filtering
- **`examination`**: **DIAGNOSTIC ANALYSIS TOOL** - JavaScript/TypeScript project diagnostics:
  - Automatic project type detection (JavaScript, TypeScript)
  - Project-wide error and warning summaries
  - File-specific detailed diagnostics
  - Integration with TypeScript compiler, ESLint, Prettier, and unit tests
  - Executes project test suite (npm run test) and reports failures
  - Uses Bun's spawn API for efficient tool execution

### System Integration
- **`terminal`**: Execute shell commands (chat agent only)

### Meta Tools
- **`thinking`**: Internal reasoning and planning
- **`fetch`**: Download external resources (chat agent only)

## Best Practices

1. **Agent-Specific Tools**: Only include tools that the agent actually needs
2. **Avoid Redundancy**: Prefer more powerful tools over multiple similar ones
3. **Security**: Limit system access tools to agents that need them
4. **Performance**: Use efficient tools for common operations
5. **Maintainability**: Keep tool sets focused and well-documented

### Tool Configurations

Different tool configurations are available:
- **`modernTools`**: Streamlined set with focused `file-system` and dedicated `find` tools
- **`chatToolsWriteMode`** / **`chatToolsAskMode`**: Specialized configurations for chat agent
- **`initTools`**: Minimal configuration for init agent
- **`tools`**: Legacy export maintained for backward compatibility

## Tool Usage Examples

### File System Operations
```typescript
// Get file metadata
await fileSystem.execute({ action: "info", path: "./package.json" })

// Get environment and project information
await fileSystem.execute({ 
  action: "env", 
  includeSystem: true, 
  includeProject: true 
})

// Get detailed directory stats
await fileSystem.execute({ action: "stats", includeHidden: true })
```

### Advanced Search with Find Tool
```typescript
// Find all TypeScript files
await find.execute({ 
  pattern: "**/*.{ts,tsx}",
  excludePatterns: ["node_modules", "dist"]
})

// Find test files with hidden files
await find.execute({
  pattern: "**/*.test.*",
  includeHidden: true
})

// Multiple patterns search
await find.execute({
  pattern: "*.js|*.ts|*.jsx|*.tsx",
  path: "./src"
})

// Find configuration files
await find.execute({
  pattern: "*config*",
  includeHidden: true
})
```

### Directory Management
```typescript
// Create nested directories
await mkdir.execute({ path: "./dist/assets" })
```

### Code Quality and Diagnostics
```typescript
// Get project-wide diagnostic summary (includes unit test results)
await examination.execute({})

// Get diagnostics for specific file (skips unit tests)
await examination.execute({ path: "src/main.ts" })

// Check for TypeScript errors in components
await examination.execute({ path: "src/components/Header.tsx" })
```

## Testing

### Test Structure

The tools in this directory are comprehensively tested with multiple test types:

- **Unit Tests**: Mock-based testing for individual components
- **Integration Tests**: End-to-end testing with real project setups  
- **Configuration Tests**: Tool set validation and security checks

### Running Tests

```bash
# Run all tool tests
bun test src/tools/__tests__

# Run specific tool tests
bun test src/tools/__tests__/examination.test.ts
bun test src/tools/__tests__/examination.unit.test.ts

# Run with coverage
bun test --coverage src/tools/__tests__
```

### Test Coverage

- **examination**: 40 unit tests + 7 integration tests
- **file-system**: Comprehensive file operations testing
- **grep**: Pattern matching and search functionality
- **edit-file**: File modification and creation testing
- **All tools**: Agent integration and configuration validation

### Testing Best Practices

1. **Isolation**: Each test runs independently with proper setup/cleanup
2. **Mocking**: External dependencies (processes, file system) are mocked appropriately
3. **Edge Cases**: Error conditions and boundary cases are thoroughly tested
4. **Real-world Scenarios**: Integration tests use actual project structures
5. **Performance**: Tests complete within reasonable time bounds

For detailed testing information, see individual test files and `EXAMINATION_TEST_SUMMARY.md`.

## Recent Fixes

### Find Tool Gitignore Scope Fix
- **Issue**: Find tool was applying `.gitignore` rules from all parent directories, causing files to be incorrectly excluded
- **Solution**: Limited gitignore scope to search directory and immediate parent only
- **Impact**: Files now correctly match specified patterns without being filtered by irrelevant parent directory rules
- **Example**: Searching for `**/*.md` in `./tmp` now correctly finds markdown files even if parent directories have gitignore rules