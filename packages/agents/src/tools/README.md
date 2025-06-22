# Agent Tools Configuration

This directory contains tools optimized for different agents in the Chara system. Tools have been organized to avoid redundancy and provide each agent with only the capabilities they need.

## Tool Categories

### Chat Tools (`chat-tools.ts`)
Tools for the interactive chat agent focused on development tasks:

- **File Operations**: `read-file`, `edit-file`
- **Directory Management**: `directory` (unified tool), `move-file`
- **Search & Analysis**: `grep`, `get-file-info`
- **External Resources**: `fetch`
- **System Integration**: `terminal`, `env-info`
- **Meta Tools**: `thinking`

### Init Tools (`init-tools.ts`)
Tools for the project initialization agent focused on analysis and configuration:

- **Directory Management**: `directory` (unified tool for all directory operations)
- **File Reading**: `read-file`, `get-file-info`
- **Search**: `grep` (for finding configuration files and patterns), `search-files`
- **Meta Tools**: `thinking`

## Removed Redundancies

### Eliminated Tools
- **`write-file`**: Removed as file creation/modification is handled by `edit-file`
- **`read-multiple-files`**: Functionality can be achieved by multiple `read-file` calls
- **`list-directory`**, **`directory-tree`**, **`current-dir`**, **`create-directory`**: Replaced by the unified `directory` tool
- **Development-only tools from init**: Removed `terminal`, `edit-file`, and other development tools from init agent since it only needs to analyze, not modify projects

### New Unified Tools
- **`directory`**: A comprehensive directory management tool that combines `create-directory`, `current-dir`, `directory-tree`, `list-directory`, and `search-files` into a single, powerful interface with enhanced glob pattern support via globby

### Tool Placement Rationale
- **`env-info` moved to chat agent**: Environment information is more useful during development for debugging, deployment setup, and system troubleshooting. The init agent only needs to analyze project structure, not system environment details.

### Tool Comparison: Why grep over search-files?

| Feature | grep | search-files |
|---------|------|--------------|
| Pattern matching | Regex support | Simple string matching |
| Content search | ✅ Can search inside files | ❌ Filename only |
| Context lines | ✅ Before/after context | ❌ No context |
| Filtering | ✅ Advanced filters | ✅ Basic exclude patterns |
| Performance | ✅ Optimized for large codebases | ⚠️ Basic recursion |

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
- **Chat agent tools**: 10 tools (streamlined with unified `directory` tool)
- **Init agent tools**: 5 tools (minimal set for project analysis)
- **Modern tools**: 10 tools (streamlined set using only essential tools)

### New Directory Tool Benefits
- **Single interface** for all directory operations instead of 4 separate tools
- **Globby integration** for powerful file search with glob patterns
- **Automatic exclusions** of build/cache directories (.chara/, .git/, node_modules/, etc.)
- **Enhanced features**: file sizes, hidden file handling, depth limits, statistics
- **Better error handling** and validation
- **Consistent API** across all directory operations

### Key Improvements
1. **Eliminated redundancy**: Consolidated multiple directory tools into unified `directory` tool
2. **Removed unnecessary tools**: Eliminated `write-file`, `read-multiple-files`, and legacy directory tools
3. **Agent-specific optimization**: Each agent only gets tools it actually needs
4. **Security improvement**: System tools like `terminal` restricted to chat agent only
5. **Performance boost**: Fewer tools mean faster initialization and less token usage

### Tools Removed from Specific Agents
- **From chat agent**: `write-file`, `read-multiple-files`, legacy directory tools
- **From init agent**: `terminal`, `edit-file`, `move-file`, `fetch`, `env-info`, `write-file`, `read-multiple-files` (development-only tools)
- **Globally removed**: `write-file`, `read-multiple-files`, `list-directory`, `directory-tree`, `current-dir`, `create-directory`

### Tools Replaced by `directory` Tool
- **`current-dir`**: Now `directory` with `action: "current"`
- **`create-directory`**: Now `directory` with `action: "create"`
- **`list-directory`**: Now `directory` with `action: "list"`
- **`directory-tree`**: Now `directory` with `action: "tree"`
- **File finding**: Now `directory` with `action: "find"` (plus globby patterns)

## Tool Descriptions

### Core File Operations
- **`read-file`**: Read single file content
- **`edit-file`**: Create new files or make precise line-based edits to existing files

### Directory Operations
- **`directory`**: **NEW UNIFIED TOOL** - Comprehensive directory management with multiple operations:
  - `list`: Get flat listing with file sizes and type indicators
  - `tree`: Get recursive tree structure with configurable depth
  - `create`: Create directories with recursive parent creation
  - `current`: Get current working directory
  - `stats`: Calculate directory statistics (file count, sizes, etc.)
  - `find`: Search using glob patterns with advanced filtering via globby
- **`move-file`**: Move/rename files and directories

### Legacy Operations (maintained for search functionality)
- **`search-files`**: Recursive file search with pattern matching (used by init agent)

### Search & Analysis
- **`grep`**: Advanced pattern search with regex, context, and filtering
- **`get-file-info`**: Get file metadata (size, type, permissions)

### System Integration
- **`terminal`**: Execute shell commands (chat agent only)
- **`env-info`**: Get system and project environment information (chat agent only)

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
- **`modernTools`**: Streamlined set with unified `directory` tool
- **`chatToolsWriteMode`** / **`chatToolsAskMode`**: Specialized configurations for chat agent
- **`initTools`**: Minimal configuration for init agent
- **`tools`**: Legacy export maintained for backward compatibility

## Directory Tool Usage Examples

### Basic Operations
```typescript
// Get current directory
await directory.execute({ action: "current" })

// List directory contents
await directory.execute({ action: "list", path: "./src" })

// Create nested directories
await directory.execute({ action: "create", path: "./dist/assets" })

// Get directory tree
await directory.execute({ action: "tree", path: "./", maxDepth: 3 })
```

### Advanced Search with Globby
```typescript
// Find all TypeScript files
await directory.execute({ 
  action: "find", 
  pattern: "**/*.{ts,tsx}",
  excludePatterns: ["node_modules", "dist"]
})

// Find test files with hidden files
await directory.execute({
  action: "find",
  pattern: "**/*.test.*",
  includeHidden: true
})
```

### Statistics and Analysis
```typescript
// Get detailed directory stats
await directory.execute({ action: "stats", includeHidden: true })

// List with file sizes
await directory.execute({ 
  action: "list", 
  includeSize: true,
  includeHidden: false 
})
```