# Actions Pattern

This directory contains the action-based architecture for the Chara CLI. The actions pattern separates business logic from command handling, making the codebase more maintainable, testable, and reusable.

## Architecture Overview

The actions pattern consists of several key components:

- **Actions**: Individual units of business logic (e.g., `init`, `reset`, `show`)
- **Action Factory**: Centralized registry and execution engine for actions
- **Action Types**: TypeScript interfaces for type safety
- **Action Enhancers**: Higher-order functions for cross-cutting concerns

## File Structure

```
actions/
├── README.md           # This file
├── index.ts           # Barrel export
├── types.ts           # TypeScript interfaces
├── factory.ts         # Action factory and enhancers
├── registry.ts        # Action registration
├── init.ts            # Init action implementation
├── reset.ts           # Reset action implementation
└── show.ts            # Show action implementation
```

## Core Concepts

### Actions

Actions are pure functions that encapsulate a single piece of business logic. They should:

- Have a single responsibility
- Be testable in isolation
- Accept options as parameters
- Handle their own error cases
- Be composable with other actions

```typescript
export async function myAction(options: MyActionOptions = {}): Promise<void> {
  // Action implementation
}
```

### Action Factory

The Action Factory provides a centralized way to register, retrieve, and execute actions:

```typescript
// Register an action
ActionFactory.register(createAction("myAction", "Description", myAction));

// Execute an action
await ActionFactory.execute("myAction", { option: "value" });
```

### Action Enhancers

Action enhancers are higher-order functions that add cross-cutting concerns:

- `withErrorHandling`: Adds standardized error handling
- `withLogging`: Adds execution logging
- `withValidation`: Adds input validation
- `compose`: Combines multiple enhancers

```typescript
const enhancedAction = compose(
  withErrorHandling,
  (fn) => withLogging(fn, "actionName"),
  (fn) => withValidation(fn, validateOptions)
)(myAction);
```

## Usage Examples

### Basic Action

```typescript
import { ActionFactory } from "../actions";

// Execute a simple action
await ActionFactory.execute("show", { verbose: true });
```

### Command Integration

```typescript
// In a command handler
export const myCommand: CommandModule = {
  handler: async (argv) => {
    try {
      await ActionFactory.execute("myAction", {
        force: argv.force,
        verbose: argv.verbose,
      });
    } catch (error) {
      logger.error("Command failed:", error);
      process.exit(1);
    }
  },
};
```

### Creating New Actions

1. **Define the action function**:
```typescript
// actions/my-new-action.ts
export async function myNewAction(options: MyNewActionOptions = {}): Promise<void> {
  // Implementation
}
```

2. **Register the action**:
```typescript
// actions/registry.ts
ActionFactory.register(
  createAction(
    "myNewAction",
    "Description of the action",
    compose(withErrorHandling, (fn) => withLogging(fn, "myNewAction"))(myNewAction),
  ),
);
```

3. **Use the action**:
```typescript
await ActionFactory.execute("myNewAction", { option: "value" });
```

## Benefits

### Separation of Concerns
- Commands handle CLI-specific logic (parsing, validation)
- Actions handle business logic
- Clear boundaries between layers

### Testability
- Actions can be tested independently
- Mock dependencies easily
- Clear input/output contracts

### Reusability
- Actions can be called from multiple commands
- Shared logic is centralized
- Consistent behavior across commands

### Maintainability
- Single responsibility principle
- Easy to modify individual actions
- Clear code organization

### Composability
- Actions can be enhanced with cross-cutting concerns
- Easy to add logging, validation, error handling
- Functional composition patterns

## Best Practices

### Action Design
- Keep actions focused on a single responsibility
- Use descriptive names and documentation
- Handle errors gracefully
- Return meaningful results when needed

### Error Handling
- Use the `withErrorHandling` enhancer for consistent error handling
- Throw meaningful error messages
- Log errors appropriately

### Testing
- Write unit tests for each action
- Mock external dependencies
- Test error scenarios
- Use type-safe test data

### Performance
- Use the `withLogging` enhancer to monitor execution times
- Avoid blocking operations in actions
- Consider async operations for I/O

## Available Actions

### `init`
Initializes Chara configuration with AI provider settings.

**Options:**
- `force`: Force initialization even if config exists
- `verbose`: Enable verbose output

### `reset`
Resets/clears all configuration.

**Options:**
- `confirm`: Skip confirmation prompt
- `verbose`: Enable verbose output

### `show`
Shows current configuration.

**Options:**
- `format`: Output format (table, json, yaml)
- `verbose`: Enable verbose output

### `default-model`
Sets the default AI model for Chara Codes.

**Options:**
- `port`: Port to start server on (default: 3031)
- `verbose`: Enable verbose output

### `start-server`
Start the Chara server with configurable options.

**Options:**
- `port`: Port to start server on (default: 3030)
- `host`: Host to bind to (default: "localhost")
- `mcpEnabled`: Enable Model Context Protocol (default: false)
- `websocketEnabled`: Enable WebSocket support (default: false)
- `corsEnabled`: Enable CORS (default: true)
- `silent`: Suppress UI output (default: false)
- `verbose`: Enable verbose output

### `stop-server`
Stop the Chara server and cleanup resources.

**Options:**
- `server`: Server manager instance to stop
- `force`: Force stop without graceful shutdown (default: false)
- `silent`: Suppress UI output (default: false)
- `verbose`: Enable verbose output

### `setup-logging`
Setup logging configuration based on verbose and trace flags.

**Options:**
- `verbose`: Enable verbose output
- `trace`: Enable trace logs (includes debug logs)

### `setup-project`
Setup and validate the project directory, changing the current working directory to the project root.

**Options:**
- `projectDir`: Project root directory (default: current working directory)
- `verbose`: Enable verbose output

### `load-config`
Load and validate the project configuration from the current directory.

**Options:**
- `verbose`: Enable verbose output

### `connect-mcp`
Connect to configured MCP (Model Context Protocol) servers.

**Options:**
- `mcpServers`: Record of MCP server configurations
- `verbose`: Enable verbose output

### `connect-events`
Connect to server events via WebSocket for real-time communication.

**Options:**
- `verbose`: Enable verbose output

### `init-api`
Initialize the API client for HTTP communication with the Chara server.

**Options:**
- `verbose`: Enable verbose output

### `init-mcp-client`
Initialize the MCP client for model context protocol operations.

**Options:**
- `verbose`: Enable verbose output

## Dev Command Architecture

The `dev` command demonstrates the power of action composition by orchestrating multiple focused actions directly in the command handler. Instead of creating a separate dev action, the command handler composes the following actions in sequence:

1. **setup-logging** - Configure log levels
2. **setup-project** - Setup project directory  
3. **load-config** - Load project configuration
4. **connect-mcp** - Connect to MCP servers
5. **connect-events** - Establish WebSocket connections
6. **init-api** - Initialize HTTP API client
7. **init-mcp-client** - Initialize MCP client

This approach keeps the orchestration logic in the command handler where it belongs, while leveraging the benefits of modular, testable actions.

## Adding New Actions

To add a new action:

1. Create the action file in `actions/`
2. Define the action function and options interface
3. Register the action in `registry.ts`
4. Export from `index.ts`
5. Add documentation to this README
6. Write tests

## Migration Guide

### From Command-Based to Action-Based

**Before:**
```typescript
// All logic in command handler
export const myCommand = {
  handler: async (argv) => {
    // 100+ lines of business logic
  },
};
```

**After:**
```typescript
// Business logic in action
export async function myAction(options) {
  // Business logic
}

// Command handler is thin
export const myCommand = {
  handler: async (argv) => {
    await ActionFactory.execute("myAction", {
      option: argv.option,
    });
  },
};
```

## Current Implementation

The actions pattern is now fully integrated into the Chara CLI. All commands use the action factory pattern to execute actions with enhanced logging, error handling, and validation.

### Unified Init Command

The init command now uses the action factory pattern exclusively:

```typescript
// Execute actions through the factory
await ActionFactory.execute<InitActionOptions>("init", {
  force: argv.force,
  verbose: argv.verbose,
});

await ActionFactory.execute<ResetActionOptions>("reset", {
  verbose: argv.verbose,
});

await ActionFactory.execute<ShowActionOptions>("show", {
  verbose: argv.verbose,
});

await ActionFactory.execute<DefaultModelActionOptions>("default-model", {
  port: argv.port,
  verbose: argv.verbose,
});
```

This provides:
- **Consistent execution**: All actions use the same execution pipeline
- **Enhanced logging**: Automatic timing and debug information
- **Error handling**: Standardized error processing and reporting
- **Validation**: Built-in option validation
- **Composition**: Easy to add new enhancers and middleware

## Command Integration

The actions are integrated with CLI commands, making them accessible via the command line:

## Available Commands

#### `chara init`
Initialize Chara configuration with AI provider settings.
```bash
chara init --force --verbose
```

#### `chara default-model`
Set default AI model for Chara Codes.
```bash
chara default-model --port 3031 --verbose
```

The command will:
1. Start a temporary server on the specified port
2. Fetch available models from `/api/models`
3. Present an interactive selection interface
4. Save the selected model to configuration
5. Clean up the server

### Command Structure

Each command follows the same pattern:
```typescript
export const commandName: CommandModule = {
  command: "command-name",
  describe: "Description of the command",
  builder: (yargs) => yargs.option(...),
  handler: async (argv) => {
    await ActionFactory.execute("action-name", {
      option: argv.option,
      verbose: argv.verbose,
    });
  },
};
```

This provides:
- **Consistent execution**: All actions use the same execution pipeline
- **Enhanced logging**: Automatic timing and debug information
- **Error handling**: Standardized error processing and reporting
- **Validation**: Built-in option validation
- **Composition**: Easy to add new enhancers and middleware

This pattern makes the codebase more modular, testable, and maintainable while providing a consistent interface for all operations.

## Server Actions

The CLI includes dedicated server actions for managing the Chara server:

- **start-server**: Start the server with configurable options
- **stop-server**: Stop the server and cleanup resources

These actions work directly with `@chara-codes/server` and are registered in the main registry. See [Server Actions Documentation](./SERVER_ACTIONS.md) for complete usage information.

### Key Features

- **Flexible Configuration**: Port, host, features (MCP, WebSocket, CORS)
- **Error Handling**: Comprehensive error handling and cleanup
- **Graceful Shutdown**: Support for both graceful and forced stops
- **Integration Ready**: Works with Action Factory and CLI commands
- **Well Tested**: Full unit test coverage

## Dev Command Refactoring

The `dev` command has been completely refactored using the actions pattern, breaking down its monolithic structure into focused, composable actions. This refactoring demonstrates the power and flexibility of the action-based architecture.

### Before: Monolithic Command

Previously, the `dev` command contained all logic in a single handler:

```typescript
// All logic in command handler
export const devCommand = {
  handler: async (argv) => {
    // 100+ lines of mixed concerns:
    // - Directory setup
    // - Configuration loading
    // - MCP server connections
    // - WebSocket setup
    // - API client initialization
    // - Error handling
  },
};
```

### After: Action-Based Architecture

The refactored `dev` command directly orchestrates specialized actions without needing a separate dev action:

```typescript
// Command handler orchestrates actions directly
export const devCommand = {
  handler: async (argv) => {
    try {
      // Step 1: Setup logging
      await ActionFactory.execute("setup-logging", {
        verbose: argv.verbose,
        trace: argv.trace,
      });

      // Step 2: Setup project directory
      const projectDir = await ActionFactory.execute("setup-project", {
        verbose: argv.verbose,
        projectDir: argv.projectDir,
      });

      // Step 3: Load configuration
      const config = await ActionFactory.execute("load-config", {
        verbose: argv.verbose,
      });

      // Step 4-7: Initialize services in sequence
      await ActionFactory.execute("connect-mcp", { ... });
      await ActionFactory.execute("connect-events", { ... });
      await ActionFactory.execute("init-api", { ... });
      await ActionFactory.execute("init-mcp-client", { ... });

      // Success output
      outro(successMessage);
    } catch (error) {
      logger.error("Failed to initialize development environment:");
      process.exit(1);
    }
  },
};
```

### Benefits of the Refactoring

#### 1. **Single Responsibility Principle**
Each action has a focused purpose:
- `setup-logging`: Configure log levels
- `setup-project`: Handle directory operations
- `load-config`: Manage configuration loading
- `connect-mcp`: Handle MCP server connections
- `connect-events`: Manage WebSocket connections
- `init-api`: Initialize HTTP API client
- `init-mcp-client`: Initialize MCP client

#### 2. **Improved Testability**
```typescript
// Test individual components in isolation
test("should setup logging correctly", async () => {
  await ActionFactory.execute("setup-logging", { trace: true });
  expect(logger.getLevel()).toBe("trace");
});

test("should connect to MCP servers", async () => {
  const clients = await ActionFactory.execute("connect-mcp", { 
    mcpServers: mockServers 
  });
  expect(clients).toHaveLength(2);
});
```

#### 3. **Enhanced Error Handling**
Each action handles its own errors with specific context:
```typescript
// setup-project.ts
try {
  process.chdir(projectDir);
} catch (error) {
  throw new Error(`Failed to change to directory: ${projectDir}: ${error.message}`);
}

// connect-mcp.ts
try {
  clientsList = await prepareClients(options.mcpServers);
} catch (error) {
  throw new Error(`Failed to connect to MCP servers: ${error.message}`);
}
```

#### 4. **Reusability**
Actions can be used independently or in different combinations:
```typescript
// Use setup actions for other commands
await ActionFactory.execute("setup-logging", { verbose: true });
await ActionFactory.execute("setup-project", { projectDir: "/custom/path" });

// Or compose differently for testing
await ActionFactory.execute("load-config");
await ActionFactory.execute("connect-mcp", { mcpServers: testServers });
```

#### 5. **Better Debugging**
With verbose logging, each action provides detailed information:
```typescript
// Output with verbose mode
DEBUG: Starting action: setup-logging
DEBUG: Log level set to: debug
DEBUG: Action "setup-logging" completed in 2ms

DEBUG: Starting action: setup-project  
DEBUG: Resolving project directory: /path/to/project
DEBUG: Successfully changed to directory: /path/to/project
DEBUG: Action "setup-project" completed in 15ms
```

#### 6. **Consistent Error Recovery**
Each action uses the same enhancers for consistent behavior:
```typescript
// All actions get the same treatment
compose<ActionOptions>(
  withErrorHandling,    // Consistent error logging
  (fn) => withLogging(fn, "action-name"), // Timing and debug info
)(actionImplementation)
```

### Action Composition

The dev command demonstrates how complex workflows can be built by composing simpler actions directly in the command handler:

```typescript
export const devCommand = {
  handler: async (argv) => {
    intro(bold(cyan("\n🚀 Starting development with Chara Codes...\n")));

    try {
      // Step 1: Setup logging first
      await ActionFactory.execute("setup-logging", {
        verbose: argv.verbose,
        trace: argv.trace,
      });

      // Step 2: Setup project directory
      const projectDir = await ActionFactory.execute("setup-project", {
        verbose: argv.verbose,
        projectDir: argv.projectDir,
      });

      // Step 3: Load configuration
      const config = await ActionFactory.execute("load-config", {
        verbose: argv.verbose,
      });

      // Step 4-7: Initialize services in order
      const clientsList = await ActionFactory.execute("connect-mcp", {
        verbose: argv.verbose,
        mcpServers: config?.mcpServers || {},
      });

      await ActionFactory.execute("connect-events", {
        verbose: argv.verbose,
      });

      await ActionFactory.execute("init-api", {
        verbose: argv.verbose,
      });

      await ActionFactory.execute("init-mcp-client", {
        verbose: argv.verbose,
      });

      // Success output
      outro(successMessage);
    } catch (error) {
      logger.error("Failed to initialize development environment:");
      logger.error((error as Error).message);
      process.exit(1);
    }
  },
};
```

### Migration Pattern

This refactoring demonstrates the migration pattern for converting monolithic commands to actions:

1. **Identify Responsibilities**: Break down the command into logical units
2. **Extract Actions**: Create individual action files for each responsibility  
3. **Define Interfaces**: Create typed options interfaces for each action
4. **Register Actions**: Add actions to the registry with enhancers
5. **Update Command**: Replace command logic with direct action orchestration
6. **Add Tests**: Write tests for individual actions and command integration

### Dev Command Dependencies

```
dev command
├── setup-logging
├── setup-project  
├── load-config
├── connect-mcp
├── connect-events
├── init-api
└── init-mcp-client
```

Each action can fail independently, and errors are properly propagated with context about which step failed.

### Real-World Impact

This refactoring transforms the dev command from a monolithic 100+ line function into:
- **7 focused actions** orchestrated by the command handler
- **Enhanced error messages** with specific context
- **Improved debugging** with step-by-step logging
- **Better testability** with isolated components
- **Increased reusability** for other commands
- **Consistent behavior** through shared enhancers
- **Direct composition** without unnecessary action wrappers

The refactoring showcases how the actions pattern can transform complex, hard-to-maintain code into a modular, testable, and maintainable architecture while keeping the orchestration logic where it belongs - in the command handler.
