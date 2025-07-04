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

The actions pattern is now fully integrated into the Chara CLI. The `init` command uses the action factory pattern to execute actions with enhanced logging, error handling, and validation.

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

### Available Commands

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
