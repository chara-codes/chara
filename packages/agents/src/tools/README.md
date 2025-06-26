# Agent Tools Configuration

This directory contains tools optimized for different agents in the Chara system. Tools have been organized to avoid redundancy and provide each agent with only the capabilities they need.

## Tool Categories

### Chat Tools (`chat-tools.ts`)
Tools for the interactive chat agent focused on development tasks:

- **File Operations**: `read-file`, `edit-file`
- **File System Management**: `file-system` (comprehensive unified tool), `move-file`
- **Search & Analysis**: `grep`
- **Code Quality**: `examination`
- **External Resources**: `fetch`
- **System Integration**: `terminal`
- **Meta Tools**: `thinking`

### Init Tools (`init-tools.ts`)
Tools for the project initialization agent focused on analysis and configuration:

- **File System Management**: `file-system` (unified tool for all file system operations)
- **File Reading**: `read-file`
- **Search**: `grep` (for finding configuration files and patterns)
- **Code Quality**: `examination`
- **Meta Tools**: `thinking`

## Removed Redundancies

### Eliminated Tools
- **`write-file`**: Removed as file creation/modification is handled by `edit-file`
- **`read-multiple-files`**: Functionality can be achieved by multiple `read-file` calls
- **`list-directory`**, **`directory-tree`**, **`current-dir`**, **`create-directory`**: Replaced by the unified `file-system` tool
- **`get-file-info`**: Merged into `file-system` tool as the `info` action
- **`env-info`**: Merged into `file-system` tool as the `env` action
- **`directory`**: Renamed and expanded to `file-system` with additional capabilities
- **Development-only tools from init**: Removed `terminal` and other development tools from init agent since it only needs to analyze, not modify projects

### New Unified Tool
- **`file-system`**: A comprehensive file system management tool that combines directory operations (`create`, `list`, `tree`, `current`, `stats`, `find`), file information (`info`), and environment analysis (`env`) into a single, powerful interface with enhanced glob pattern support via globby

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
- **Chat agent tools**: 8 tools (streamlined with unified `file-system` tool)
- **Init agent tools**: 4 tools (minimal set for project analysis)
- **Modern tools**: 8 tools (streamlined set using only essential tools)

### New File System Tool Benefits
- **Single interface** for all file system operations instead of 6+ separate tools
- **Globby integration** for powerful file search with glob patterns
- **Automatic exclusions** of build/cache directories (.chara/, .git/, node_modules/, etc.)
- **Enhanced features**: file sizes, hidden file handling, depth limits, statistics, file metadata, environment analysis
- **Better error handling** and validation
- **Consistent API** across all file system operations
- **Environment integration**: Project configuration and system information in one tool

### Key Improvements
1. **Eliminated redundancy**: Consolidated multiple directory tools into unified `directory` tool
2. **Removed unnecessary tools**: Eliminated `write-file`, `read-multiple-files`, and legacy directory tools
3. **Agent-specific optimization**: Each agent only gets tools it actually needs
4. **Security improvement**: System tools like `terminal` restricted to chat agent only
5. **Performance boost**: Fewer tools mean faster initialization and less token usage

### Tools Removed from Specific Agents
- **From chat agent**: `write-file`, `read-multiple-files`, `get-file-info`, `env-info`, legacy directory tools
- **From init agent**: `terminal`, `move-file`, `fetch`, `get-file-info`, `env-info`, `write-file`, `read-multiple-files` (development-only tools)
- **Globally removed**: `write-file`, `read-multiple-files`, `list-directory`, `directory-tree`, `current-dir`, `create-directory`, `get-file-info`, `env-info`, `directory`

### Tools Replaced by `file-system` Tool
- **`current-dir`**: Now `file-system` with `action: "current"`
- **`create-directory`**: Now `file-system` with `action: "create"`
- **`list-directory`**: Now `file-system` with `action: "list"`
- **`directory-tree`**: Now `file-system` with `action: "tree"`
- **`get-file-info`**: Now `file-system` with `action: "info"`
- **`env-info`**: Now `file-system` with `action: "env"`
- **File finding**: Now `file-system` with `action: "find"` (plus globby patterns)
- **Directory stats**: Now `file-system` with `action: "stats"`

## Tool Descriptions

### Core File Operations
- **`read-file`**: Read single file content
- **`edit-file`**: Create new files or make precise line-based edits to existing files

### File System Operations
- **`file-system`**: **COMPREHENSIVE UNIFIED TOOL** - Complete file system management with multiple operations:
  - `list`: Get flat listing with file sizes and type indicators
  - `tree`: Get recursive tree structure with configurable depth
  - `create`: Create directories with recursive parent creation
  - `current`: Get current working directory
  - `stats`: Calculate directory statistics (file count, sizes, etc.)
  - `find`: Search using glob patterns with advanced filtering via globby
  - `info`: Get detailed file/directory metadata (size, timestamps, permissions)
  - `env`: Get comprehensive environment and project configuration information
- **`move-file`**: Move/rename files and directories (chat agent only)

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

## Tool Configurations

Different tool configurations are available:
- **`modernTools`**: Streamlined set with unified `file-system` tool
- **`chatToolsWriteMode`** / **`chatToolsAskMode`**: Specialized configurations for chat agent
- **`initTools`**: Minimal configuration for init agent
- **`tools`**: Legacy export maintained for backward compatibility

## File System Tool Usage Examples

### Directory Operations
```typescript
// Get current directory
await fileSystem.execute({ action: "current" })

// List directory contents
await fileSystem.execute({ action: "list", path: "./src" })

// Create nested directories
await fileSystem.execute({ action: "create", path: "./dist/assets" })

// Get directory tree
await fileSystem.execute({ action: "tree", path: "./", maxDepth: 3 })
```

### Advanced Search with Globby
```typescript
// Find all TypeScript files
await fileSystem.execute({ 
  action: "find", 
  pattern: "**/*.{ts,tsx}",
  excludePatterns: ["node_modules", "dist"]
})

// Find test files with hidden files
await fileSystem.execute({
  action: "find",
  pattern: "**/*.test.*",
  includeHidden: true
})
```

### File Information and Environment
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