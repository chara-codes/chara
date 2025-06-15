# Agent Tools Configuration

This directory contains tools optimized for different agents in the Chara system. Tools have been organized to avoid redundancy and provide each agent with only the capabilities they need.

## Tool Categories

### Chat Tools (`chat-tools.ts`)
Tools for the interactive chat agent focused on development tasks:

- **File Operations**: `read-file`, `write-file`, `read-multiple-files`, `edit-file`
- **Directory Management**: `create-directory`, `list-directory`, `move-file`
- **Search & Analysis**: `grep`, `get-file-info`
- **External Resources**: `fetch`
- **System Integration**: `terminal`, `env-info`
- **Meta Tools**: `thinking`, `save-to-history`, `diff`

### Init Tools (`init-tools.ts`)
Tools for the project initialization agent focused on analysis and configuration:

- **Project Analysis**: `current-dir`, `directory-tree`
- **File Reading**: `read-file`, `read-multiple-files`, `get-file-info`
- **Directory Navigation**: `list-directory`
- **Search**: `grep` (for finding configuration files and patterns)
- **Configuration**: `write-file` (only for creating `.chara.json`)
- **Meta Tools**: `thinking`

## Removed Redundancies

### Eliminated Tools
- **`search-files`**: Removed in favor of the more powerful `grep` tool which provides better pattern matching and context
- **Development-only tools from init**: Removed `terminal`, `edit-file`, and other development tools from init agent since it only needs to analyze, not modify projects

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
- **Chat agent tools**: 15 tools (21% reduction, focused on development)
- **Init agent tools**: 9 tools (53% reduction, focused on analysis)

### Key Improvements
1. **Eliminated redundancy**: Removed `search-files` in favor of more powerful `grep`
2. **Agent-specific optimization**: Each agent only gets tools it actually needs
3. **Security improvement**: System tools like `terminal` restricted to chat agent only
4. **Performance boost**: Fewer tools mean faster initialization and less token usage

### Tools Removed from Specific Agents
- **From chat agent**: `current-dir`, `directory-tree`, `init-git` (analysis-only tools)
- **From init agent**: `terminal`, `edit-file`, `move-file`, `fetch`, `save-to-history`, `diff`, `init-git`, `env-info` (development-only tools)
- **From both**: `search-files` (replaced by superior `grep` functionality)

## Tool Descriptions

### Core File Operations
- **`read-file`**: Read single file content
- **`read-multiple-files`**: Read multiple files efficiently in parallel
- **`write-file`**: Create/overwrite file with content
- **`edit-file`**: Make precise line-based edits to existing files

### Directory Operations
- **`list-directory`**: Get flat listing of directory contents
- **`directory-tree`**: Get recursive tree structure as JSON
- **`create-directory`**: Create directories with parent creation
- **`move-file`**: Move/rename files and directories

### Search & Analysis
- **`grep`**: Advanced pattern search with regex, context, and filtering
- **`get-file-info`**: Get file metadata (size, type, permissions)

### System Integration
- **`terminal`**: Execute shell commands (chat agent only)
- **`current-dir`**: Get current working directory (init agent only)
- **`env-info`**: Get system and project environment information (chat agent only)

### Meta Tools
- **`thinking`**: Internal reasoning and planning
- **`save-to-history`**: Save important interactions (chat agent only)
- **`diff`**: Compare file changes (chat agent only)
- **`fetch`**: Download external resources (chat agent only)

## Best Practices

1. **Agent-Specific Tools**: Only include tools that the agent actually needs
2. **Avoid Redundancy**: Prefer more powerful tools over multiple similar ones
3. **Security**: Limit system access tools to agents that need them
4. **Performance**: Use efficient tools for common operations
5. **Maintainability**: Keep tool sets focused and well-documented

## Legacy Support

The original `tools` export in `index.ts` is maintained for backward compatibility, but new agents should use the specialized tool configurations.