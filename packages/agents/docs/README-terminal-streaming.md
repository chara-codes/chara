# Terminal Tool with Streaming Support

The terminal tool now supports real-time streaming of stdout and stderr output through the `appEvents` system. This allows applications to monitor command execution in real-time and provide live feedback to users.

## How It Works

When a command is executed using the terminal tool, it emits events through the `appEvents` EventEmitter with the following structure:

```typescript
appEvents.emit("tool:calling", {
  name: "terminal",
  toolCallId: string,           // Unique identifier for this tool call
  data: {
    type: "stdout" | "stderr" | "complete",
    chunk?: string,             // The output chunk (for stdout/stderr)
    command: string,            // The executed command
    cd: string,                // Working directory
    exitCode?: number          // Exit code (for complete events)
  }
});
```

## Event Types

### `stdout` Events
- Emitted when the command writes to stdout
- Contains the output chunk in `data.chunk`
- Fired in real-time as output is produced
- Includes the `toolCallId` to track specific command executions

### `stderr` Events
- Emitted when the command writes to stderr
- Contains the error output chunk in `data.chunk`
- Fired in real-time as error output is produced
- Includes the `toolCallId` to track specific command executions

### `complete` Events
- Emitted when the command finishes execution
- Contains the final exit code in `data.exitCode`
- Always fired once per command execution
- Includes the `toolCallId` to track specific command executions

## Usage Examples

### Basic Event Listening

```typescript
import { terminal } from "./tools/terminal";
import { appEvents } from "./services/events";

// Set up event listener
appEvents.on("tool:calling", (eventData) => {
  if (eventData.name === "terminal") {
    const { type, chunk, command, exitCode } = eventData.data;
    const { toolCallId } = eventData;
    
    switch (type) {
      case "stdout":
        console.log(`[OUT:${toolCallId}] ${chunk}`);
        break;
      case "stderr":
        console.log(`[ERR:${toolCallId}] ${chunk}`);
        break;
      case "complete":
        console.log(`Command "${command}" (${toolCallId}) finished with code: ${exitCode}`);
        break;
    }
  }
});

// Execute command
await terminal.execute({
  command: "echo 'Hello World'",
  cd: process.cwd()
});
```

### Real-time Progress Monitoring

```typescript
const commandOutputs = new Map<string, string>();

const progressListener = (eventData) => {
  if (eventData.name === "terminal") {
    const { toolCallId } = eventData;
    const { type, chunk, command, exitCode } = eventData.data;
    
    if (type === "stdout") {
      const existing = commandOutputs.get(toolCallId) || "";
      commandOutputs.set(toolCallId, existing + chunk);
      // Update UI with real-time output for this specific command
      updateProgressDisplay(toolCallId, commandOutputs.get(toolCallId));
    } else if (type === "complete") {
      console.log(`Command ${toolCallId} completed with exit code: ${exitCode}`);
    }
  }
};

appEvents.on("tool:calling", progressListener);

try {
  await terminal.execute({
    command: "npm install",
    cd: "/path/to/project"
  });
} finally {
  appEvents.off("tool:calling", progressListener);
}
```

### Tracking Multiple Concurrent Commands

```typescript
const activeCommands = new Map<string, {
  command: string;
  stdout: string[];
  stderr: string[];
  startTime: number;
  exitCode?: number;
}>();

appEvents.on("tool:calling", (eventData) => {
  if (eventData.name === "terminal") {
    const { toolCallId } = eventData;
    const { type, chunk, command, exitCode } = eventData.data;
    
    // Initialize tracking for new commands
    if (!activeCommands.has(toolCallId)) {
      activeCommands.set(toolCallId, {
        command,
        stdout: [],
        stderr: [],
        startTime: Date.now(),
      });
    }
    
    const tracking = activeCommands.get(toolCallId)!;
    
    switch (type) {
      case "stdout":
        tracking.stdout.push(chunk);
        console.log(`[${toolCallId}] STDOUT: ${chunk.trim()}`);
        break;
      case "stderr":
        tracking.stderr.push(chunk);
        console.log(`[${toolCallId}] STDERR: ${chunk.trim()}`);
        break;
      case "complete":
        tracking.exitCode = exitCode;
        const duration = Date.now() - tracking.startTime;
        console.log(`[${toolCallId}] Completed in ${duration}ms with exit code: ${exitCode}`);
        
        // Optional: Clean up completed commands
        // activeCommands.delete(toolCallId);
        break;
    }
  }
});

// Run multiple commands concurrently
const promises = [
  terminal.execute({ command: "echo 'Command 1'", cd: process.cwd() }),
  terminal.execute({ command: "echo 'Command 2'", cd: process.cwd() }),
  terminal.execute({ command: "echo 'Command 3'", cd: process.cwd() }),
];

await Promise.all(promises);
```

### Buffering Output by Command

```typescript
class CommandTracker {
  private outputs = new Map<string, {
    stdout: string;
    stderr: string;
    exitCode?: number;
    command: string;
  }>();

  constructor() {
    appEvents.on("tool:calling", this.handleEvent.bind(this));
  }

  private handleEvent(eventData: any) {
    if (eventData.name === "terminal") {
      const { toolCallId } = eventData;
      const { type, chunk, command, exitCode } = eventData.data;

      if (!this.outputs.has(toolCallId)) {
        this.outputs.set(toolCallId, {
          stdout: "",
          stderr: "",
          command,
        });
      }

      const output = this.outputs.get(toolCallId)!;

      switch (type) {
        case "stdout":
          output.stdout += chunk;
          break;
        case "stderr":
          output.stderr += chunk;
          break;
        case "complete":
          output.exitCode = exitCode;
          this.onCommandComplete(toolCallId, output);
          break;
      }
    }
  }

  private onCommandComplete(toolCallId: string, output: any) {
    console.log(`Command ${toolCallId} completed:`);
    console.log(`  Command: ${output.command}`);
    console.log(`  Exit Code: ${output.exitCode}`);
    console.log(`  Stdout: ${output.stdout.length} chars`);
    console.log(`  Stderr: ${output.stderr.length} chars`);
  }

  getCommandOutput(toolCallId: string) {
    return this.outputs.get(toolCallId);
  }

  cleanup() {
    appEvents.removeAllListeners("tool:calling");
  }
}

const tracker = new CommandTracker();
// Use tracker...
tracker.cleanup(); // Don't forget to clean up!
```

## Benefits

1. **Real-time Feedback**: Users can see command output as it happens
2. **Command Tracking**: Each command execution has a unique `toolCallId` for tracking
3. **Concurrent Support**: Multiple commands can be tracked simultaneously
4. **Progress Monitoring**: Long-running commands can show progress updates
5. **Error Detection**: Stderr output is available immediately
6. **Better UX**: Applications can provide live status updates
7. **Debugging**: Easier to debug command execution issues with unique identifiers

## Important Notes

- Events are emitted in real-time as the command produces output
- Each command execution gets a unique `toolCallId` for tracking
- The `complete` event is always emitted last with the final exit code
- Output chunks may vary in size depending on how the command writes output
- Remember to clean up event listeners to prevent memory leaks
- The streaming functionality works alongside the existing return value system
- When testing directly (not through AI SDK), `toolCallId` may show as "unknown"

## Error Handling

Streaming events are emitted even if the command fails. The `complete` event will contain the actual exit code, allowing you to handle both successful and failed commands appropriately.

```typescript
appEvents.on("tool:calling", (eventData) => {
  if (eventData.name === "terminal" && eventData.data.type === "complete") {
    const { exitCode, command } = eventData.data;
    const { toolCallId } = eventData;
    
    if (exitCode === 0) {
      console.log(`✅ Command "${command}" (${toolCallId}) succeeded`);
    } else {
      console.log(`❌ Command "${command}" (${toolCallId}) failed with code ${exitCode}`);
    }
  }
});
```

## Testing

The streaming functionality is thoroughly tested in `terminal-streaming.test.ts`. You can run the tests with:

```bash
bun test src/tools/__tests__/terminal-streaming.test.ts
```

For a comprehensive demonstration, run the example:

```bash
bun run src/examples/terminal-streaming.ts
```

## Tool Call ID Context

The `toolCallId` is provided by the AI SDK when the tool is called within an AI context. When testing the tool directly (outside of the AI SDK), the `toolCallId` will default to "unknown". In production usage with AI agents, each tool call will have a unique identifier allowing for proper tracking and correlation of streaming events with specific command executions.