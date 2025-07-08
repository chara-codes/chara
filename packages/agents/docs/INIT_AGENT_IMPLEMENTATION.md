# Init Agent Implementation

This document provides a comprehensive overview of the Init Agent implementation in the Chara Codes project. The Init Agent is responsible for analyzing project structures and generating `.chara.json` configuration files.

## Overview

The Init Agent is an AI-powered tool that automatically analyzes project directories to understand their structure, technology stack, and development workflow. It generates a standardized `.chara.json` configuration file that contains essential project information and development commands.

## Architecture

### Core Components

1. **Init Agent** (`chara/packages/agents/src/agents/init-agent.ts`)
   - Main agent implementation using AI SDK
   - Orchestrates the analysis process
   - Generates streaming responses

2. **Init Prompt** (`chara/packages/agents/src/prompts/init.ts`)
   - Comprehensive system prompt for AI analysis
   - Defines analysis strategy and rules
   - Specifies output format requirements

3. **Tools Integration** (`chara/packages/agents/src/tools/`)
   - File system operations (read, list, search)
   - Directory traversal and analysis
   - Git operations and project metadata

## Generated Configuration Structure

The Init Agent generates a `.chara.json` file with the following structure:

```json
{
  "dev": "command to start development server",
  "info": {
    "name": "project name",
    "description": "project description",
    "version": "project version",
    "frameworks": ["framework1", "framework2"],
    "tools": ["tool1", "tool2"],
    "stack": ["technology1", "technology2"],
    "packageManager": "npm|yarn|pnpm|bun",
    "scripts": {"script1": "command1"},
    "dependencies": ["dep1", "dep2"],
    "devDependencies": ["devDep1", "devDep2"],
    "languages": ["language1", "language2"],
    "projectType": "web|api|library|cli|mobile|desktop|other"
  }
}
```

## Analysis Process

### 1. Project Structure Analysis
- Uses `directory-tree` tool to understand project layout
- Identifies key directories (src, lib, app, components, etc.)
- Looks for configuration files and build tools

### 2. Package Management Detection
- Checks for package.json, yarn.lock, pnpm-lock.yaml, bun.lockb
- Reads package.json to understand dependencies and scripts
- Identifies the package manager being used

### 3. Framework and Technology Detection
- Analyzes dependencies to identify frameworks
- Looks for framework-specific files (next.config.js, vite.config.ts, etc.)
- Detects programming languages and runtime environments

### 4. Development Command Detection
- Checks package.json scripts for common dev commands
- Considers framework-specific development patterns
- Falls back to sensible defaults based on detected stack

### 5. Project Type Classification
- **web**: Frontend applications (React, Vue, Angular apps)
- **api**: Backend services (Express, FastAPI, etc.)
- **library**: Reusable packages/libraries
- **cli**: Command-line tools
- **mobile**: React Native, Flutter apps
- **desktop**: Electron, Tauri apps
- **other**: Projects that don't fit standard categories

## Supported Project Types

### JavaScript/TypeScript Projects
- **Next.js Applications**
  - Detects: next.config.js, Next.js dependencies
  - Dev command: `next dev`
  - Project type: `web`

- **React Applications**
  - Detects: React dependencies, src/App.js patterns
  - Dev command: `react-scripts start` or `vite`
  - Project type: `web`

- **Vue Applications**
  - Detects: Vue dependencies, vite.config.js
  - Dev command: `vite` or `vue-cli-service serve`
  - Project type: `web`

- **Express APIs**
  - Detects: Express dependencies, server patterns
  - Dev command: `ts-node-dev` or `nodemon`
  - Project type: `api`

- **React Native Apps**
  - Detects: react-native dependencies, metro.config.js
  - Dev command: `react-native start`
  - Project type: `mobile`

### Python Projects
- **FastAPI Applications**
  - Detects: FastAPI dependencies, main.py patterns
  - Dev command: `uvicorn main:app --reload`
  - Project type: `api`

- **Django Applications**
  - Detects: Django dependencies, manage.py
  - Dev command: `python manage.py runserver`
  - Project type: `web`

### Rust Projects
- **Cargo Projects**
  - Detects: Cargo.toml, src/main.rs
  - Dev command: `cargo run`
  - Project type: Determined by binary vs library

### Monorepos
- **Turborepo**
  - Detects: turbo.json, workspace configuration
  - Dev command: `turbo run dev`
  - Project type: Based on workspace contents

## Usage Examples

### Basic Usage
```typescript
import { initAgent } from '@chara-codes/agents';

const result = await initAgent({
  model: "openai:::gpt-4o-mini",
  workingDir: "/path/to/project"
});

for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}
```

### Command Line Usage
```bash
# Analyze current project
bun run init-agent

# Analyze specific project
bun run init-agent analyze ./my-project

# Test with different models
bun run init-agent models
```

### Integration with CLI
```typescript
// In a CLI tool
import { initAgent } from '@chara-codes/agents';

async function initializeProject(projectPath: string) {
  const result = await initAgent({
    model: "openai:::gpt-4o-mini",
    workingDir: projectPath
  });
  
  // Process the streaming response
  let fullResponse = "";
  for await (const chunk of result.textStream) {
    fullResponse += chunk;
  }
  
  // Extract and save the .chara.json content
  // (Implementation would parse the AI response for JSON)
}
```

## Configuration Detection Logic

### Package Manager Detection
1. **Bun**: Look for `bun.lockb` or `packageManager: "bun"` in package.json
2. **pnpm**: Look for `pnpm-lock.yaml` or `packageManager: "pnpm"`
3. **Yarn**: Look for `yarn.lock` or `packageManager: "yarn"`
4. **npm**: Default fallback or `package-lock.json`

### Framework Detection
1. **Dependencies Analysis**: Check package.json dependencies
2. **Config Files**: Look for framework-specific config files
3. **File Patterns**: Analyze directory structure and file naming
4. **Import Patterns**: Examine source code imports (when needed)

### Development Command Priority
1. Check package.json scripts for: "dev", "develop", "start", "serve"
2. Framework-specific defaults:
   - Next.js: "next dev"
   - Vite: "vite" or "vite dev"
   - Create React App: "react-scripts start"
   - Vue CLI: "vue-cli-service serve"
   - Angular: "ng serve"
3. Fallback to package manager + "run dev"

## Testing and Validation

### Simulation Tests
The implementation includes comprehensive simulation tests that validate the detection logic:

```bash
# Run simulation tests
bun run test-init
```

The simulation tests cover:
- Next.js applications
- Vue + Vite applications
- Express APIs
- React Native apps
- Python FastAPI projects

### Test Coverage
- ✅ Framework detection accuracy
- ✅ Package manager identification
- ✅ Development command generation
- ✅ Project type classification
- ✅ Dependency analysis
- ✅ Configuration file generation

## Error Handling

### Common Scenarios
1. **Missing package.json**: Attempts to infer from other files
2. **Ambiguous project type**: Uses heuristics and falls back to "other"
3. **Multiple frameworks**: Prioritizes primary framework
4. **No dev script**: Suggests appropriate default based on stack

### Graceful Degradation
- If specific detection fails, falls back to general patterns
- Provides sensible defaults for missing information
- Includes confidence indicators in generated config

## Extension Points

### Adding New Framework Support
1. Update the init prompt with new detection patterns
2. Add framework-specific file patterns to analyze
3. Define appropriate dev commands and project types
4. Add test cases to simulation suite

### Custom Analysis Rules
The prompt system allows for easy extension of analysis rules:
- Add new file patterns to detect
- Define new project type classifications
- Extend dependency analysis logic
- Add custom development command patterns

## Performance Considerations

### Analysis Efficiency
- Limits file reading to essential files
- Uses directory listing before deep analysis
- Implements smart caching for repeated patterns
- Streams results for immediate feedback

### Token Usage Optimization
- Focuses analysis on key indicator files
- Summarizes large files rather than reading entirely
- Uses structured prompts to minimize token usage
- Implements early termination for clear matches

## Security Considerations

### Safe File Access
- Only reads standard configuration files
- Respects .gitignore patterns
- Excludes sensitive files (.env, secrets)
- Validates file paths before access

### AI Model Safety
- Uses structured prompts to prevent injection
- Validates generated JSON structure
- Sanitizes file content before analysis
- Implements output validation

## Future Enhancements

### Planned Features
1. **Interactive Mode**: Allow user confirmation/modification
2. **Template Generation**: Create additional project files
3. **CI/CD Integration**: Generate workflow configurations
4. **Dependency Updates**: Suggest package updates
5. **Performance Analysis**: Identify optimization opportunities

### Extensibility
- Plugin system for custom analyzers
- Template-based configuration generation
- Integration with external tools and services
- Support for custom project conventions

## Troubleshooting

### Common Issues
1. **Model Access**: Ensure API keys are configured
2. **File Permissions**: Check directory read permissions
3. **Large Projects**: May timeout on very large codebases
4. **Complex Monorepos**: May need manual guidance

### Debug Mode
Enable detailed logging to troubleshoot analysis issues:
```typescript
process.env.CHARA_DEBUG = "true";
```

## Contributing

### Adding Support for New Technologies
1. Analyze the technology's common patterns
2. Update the init prompt with detection logic
3. Add test cases to the simulation suite
4. Update documentation with examples

### Best Practices
- Keep detection logic simple and reliable
- Prefer explicit patterns over heuristics
- Add comprehensive test coverage
- Document new patterns clearly

This implementation provides a robust foundation for automatic project analysis and configuration generation, making it easier for developers to get started with Chara Codes in any project.