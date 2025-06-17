# Pretty Stream Logger

A lightweight, developer-friendly stream logger for agent interactions with beautiful colors and clear visual indicators.

## Features

- 🎨 **Colorful Output**: Uses picocolors for beautiful, readable console output
- 🚀 **Real-time Streaming**: Shows text as it streams in real-time
- 🔧 **Tool Call Tracking**: Clear visualization of tool calls and their results
- ⚡ **Performance Metrics**: Shows timing and token usage information
- 📊 **Multiple Presets**: Detailed, compact, and minimal output modes
- 🎯 **Developer Experience**: Focuses on what matters most during development
- ⚙️ **Function-based API**: Simple, lightweight functions without classes

## Quick Start

```typescript
import { logWithPreset, logStream } from './pretty-stream-logger.js';

// Quick logging with presets
logWithPreset(streamData, 'detailed');

// Custom options
logStream(streamData, { 
  showTimestamps: true, 
  compactMode: false 
});
```

## Function API

### Main Functions

#### `logWithPreset(data, preset)`
Quick logging with predefined configurations:
```typescript
logWithPreset(streamData, 'detailed');  // Full verbose output
logWithPreset(streamData, 'compact');   // Reduced verbosity  
logWithPreset(streamData, 'minimal');   // Maximum brevity
```

#### `logStream(buffer, options)`
Log a complete stream with custom options and automatic cleanup:
```typescript
logStream(streamData, {
  showTimestamps: true,
  showToolDetails: true,
  compactMode: false,
  indent: "  "
});
```

#### `logStreamChunk(chunk, options)`
Log individual stream chunks:
```typescript
const chunk = { type: "step-start", messageId: "msg-123" };
logStreamChunk(chunk, { showToolDetails: true });
```

#### `logStreamBuffer(buffer, options)`
Process multiple chunks from a raw buffer:
```typescript
logStreamBuffer(rawStreamData, { compactMode: true });
```

### Utility Functions

#### `flushTextBuffer()`
Flush any remaining streamed text:
```typescript
// After processing individual chunks
for (const chunk of chunks) {
  logStreamChunk(chunk);
}
flushTextBuffer(); // Clean up any pending text
```

#### `resetLoggerState()`
Reset internal state between different streams:
```typescript
resetLoggerState(); // Start fresh for new stream
logStream(newStreamData);
```

#### `demoLogger(options?)`
Run a demonstration with sample data:
```typescript
demoLogger(); // Default options
demoLogger({ compactMode: true }); // Custom options
```

## Stream Chunk Types

The logger handles these stream chunk types:

- `step-start` - Beginning of an agent step
- `step-finish` - End of an agent step with metrics
- `tool-call-streaming-start` - Tool call initiation
- `tool-call-delta` - Streaming tool call arguments
- `tool-call` - Complete tool call
- `tool-result` - Tool execution result
- `text-delta` - Streaming text content

## Configuration Options

```typescript
interface LoggerOptions {
  showTimestamps?: boolean;    // Show timestamps (default: false)
  showToolDetails?: boolean;   // Show detailed tool info (default: true)
  compactMode?: boolean;       // Reduce verbosity (default: false)
  indent?: string;             // Indentation string (default: "  ")
}
```

## Preset Configurations

### Available Presets

```typescript
import { presets } from './pretty-stream-logger.js';

// Access preset configurations
const detailed = presets.detailed;  // Full verbose output
const compact = presets.compact;    // Reduced verbosity
const minimal = presets.minimal;    // Maximum brevity
```

### Detailed Mode (Default)
Best for development and debugging:
```typescript
logWithPreset(streamData, 'detailed');
```
- Shows all tool details and arguments
- Displays file paths, content summaries
- Shows token usage and timing
- Full verbose output

### Compact Mode
Good for CI/CD logs:
```typescript
logWithPreset(streamData, 'compact');
```
- Hides detailed tool arguments
- Shows only essential information
- Reduced visual noise
- Still shows progress and results

### Minimal Mode
For production or when you need clean output:
```typescript
logWithPreset(streamData, 'minimal');
```
- Only shows major steps
- No timestamps or detailed metrics
- Maximum brevity

## Visual Elements

### Step Indicators
- 🚀 **Step Start**: Shows model and user message preview
- ✅ **Step Complete**: Green for normal completion
- 🔧 **Tool Calls**: Blue for steps ending with tool calls
- ❌ **Error**: Red for failed steps

### Tool Icons
- 📖 `read-file` - Reading files
- ✍️ `write-file` - Writing files
- 📂 `list-directory` - Directory listings
- 🌳 `directory-tree` - Tree structures
- 🔍 `grep` - Searching content
- 📍 `current-dir` - Current directory
- 🤔 `thinking` - AI reasoning
- 🔧 Generic tools

### Progress Indicators
- ⚙️ Tool arguments preview
- 📄 File operation details
- 📊 Token usage metrics
- ⏱️ Timing information
- │ Text streaming prefix

## Example Output

```
🚀 Starting new step [gpt-4.1-mini]
  💭 Analyze the project and create a configuration file

  📖 read-file (streaming...)
  📖 read-file ✓ (45ms)
    📄 Reading: package.json
    📋 Content: 36 lines, 919 chars

  ✍️ write-file
    ✏️  Writing: .chara.json
    ✅ Success

│ Based on the analysis, this is a React project with...

✅ Step completed (156ms)
  📊 Tokens: 325 (250 + 75)
```

## Advanced Usage

### Custom Configuration
```typescript
import { logStream } from './pretty-stream-logger.js';

logStream(streamData, {
  showTimestamps: true,
  showToolDetails: true,
  compactMode: false,
  indent: "    ", // 4 spaces
});
```

### Processing Multiple Formats
```typescript
// From individual chunks
const chunks = parseStreamChunks(data);
for (const chunk of chunks) {
  logStreamChunk(chunk, { compactMode: true });
}
flushTextBuffer();

// From a complete buffer
logStream(entireStreamBuffer);
```

### Integration with Streams
```typescript
// With a readable stream
stream.on('data', (chunk) => {
  try {
    const parsed = JSON.parse(chunk.toString());
    logStreamChunk(parsed);
  } catch (error) {
    // Handle parsing errors
  }
});

stream.on('end', () => {
  flushTextBuffer();
});
```

### Real-time Processing
```typescript
import { logStreamChunk, resetLoggerState, flushTextBuffer } from './pretty-stream-logger.js';

// Start fresh
resetLoggerState();

// Process chunks as they arrive
async function processStream(streamSource) {
  for await (const chunk of streamSource) {
    logStreamChunk(chunk);
  }
  flushTextBuffer();
}
```

## Performance Notes

- All functions are stateless except for text buffering
- Automatic state management with cleanup functions
- Memory usage is minimal even with large streams
- Text streaming uses `process.stdout.write()` for real-time output
- No class instances or complex state management

## Error Handling

The logger gracefully handles:
- Invalid JSON chunks (skips with optional warning)
- Missing chunk properties (uses sensible defaults)
- Unknown chunk types (logs with warning in verbose mode)
- Parsing errors (continues processing)

## Integration Tips

1. **Development**: Use `'detailed'` preset to see everything
2. **CI/CD**: Use `'compact'` preset for cleaner logs
3. **Production**: Use `'minimal'` preset or disable logging
4. **Debugging**: Enable timestamps for time-based analysis
5. **Large Files**: The logger summarizes large content automatically

## Examples

### Basic Usage
```typescript
import { logWithPreset } from './pretty-stream-logger.js';

// Simple one-liner
logWithPreset(streamData, 'detailed');
```

### Custom Processing
```typescript
import { logStreamChunk, flushTextBuffer, presets } from './pretty-stream-logger.js';

// Process individual chunks with detailed preset
chunks.forEach(chunk => logStreamChunk(chunk, presets.detailed));
flushTextBuffer();
```

### Stream Integration
```typescript
import { logStream } from './pretty-stream-logger.js';

// Complete stream processing with custom options
logStream(streamBuffer, {
  showTimestamps: true,
  compactMode: false
});
```

Run the examples:
```bash
bun run example-logger.ts
bun run src/utils/test-logger.ts
```

## Migration from Class-based API

Old class-based approach:
```typescript
const logger = new PrettyStreamLogger(options);
logger.log(chunk);
logger.logBuffer(buffer);
logger.flush();
```

New function-based approach:
```typescript
logStreamChunk(chunk, options);
logStreamBuffer(buffer, options);
flushTextBuffer();

// Or even simpler:
logWithPreset(buffer, 'detailed');
```
