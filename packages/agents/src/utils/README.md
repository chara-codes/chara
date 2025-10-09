# Utilities

This directory contains various utility functions for the agents package.

## Pretty Stream Logger

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

---

# Vercel-to-Gemini Tool Converter

A utility to convert Vercel AI SDK tools to Google Gemini FunctionDeclaration format, enabling seamless integration between different AI providers.

## Overview

This converter bridges the gap between Vercel AI SDK's tool format and Google Gemini's function declaration format. It handles the conversion of JSON Schema definitions to Gemini's native schema format while preserving all constraints and validation rules.

Based on the comprehensive mapping documented in: [Zod to Gemini Function Declaration Mapping](https://github.com/ben-vargas/ai-sdk-provider-gemini-cli/blob/main/docs/zod-to-gemini-mapping.md)

## Features

- 🔄 **Complete Conversion**: Converts Vercel AI SDK tools to Gemini FunctionDeclaration format
- 📋 **Schema Mapping**: Maps JSON Schema types to Gemini Schema types
- ✅ **Constraint Preservation**: Maintains validation rules (min/max, patterns, etc.)
- 🧪 **Validation**: Detects unsupported schema features before conversion
- 🎯 **Flexible Options**: Choose between native Gemini schema or JSON schema fallback
- 🔍 **Type Safety**: Full TypeScript support with proper type definitions

## Quick Start

```typescript
import { convertVercelToolToGemini, createTestTool } from './vercel-to-gemini-converter';

// Create a sample tool
const weatherTool = createTestTool(
  'get_weather',
  'Get weather information',
  {
    type: 'object',
    properties: {
      location: { type: 'string', description: 'City name' },
      units: { type: 'string', enum: ['celsius', 'fahrenheit'] }
    },
    required: ['location']
  }
);

// Convert to Gemini format
const geminiTool = convertVercelToolToGemini(weatherTool);
```

## API Reference

### Main Functions

#### `convertVercelToolToGemini(tool, useJsonSchema?)`

Converts a single Vercel AI SDK tool to Gemini format.

```typescript
function convertVercelToolToGemini(
  tool: LanguageModelV1FunctionTool,
  useJsonSchema?: boolean
): GeminiFunctionDeclaration
```

**Parameters:**
- `tool` - The Vercel AI SDK tool to convert
- `useJsonSchema` - If true, uses `parametersJsonSchema` instead of converting to Gemini schema (default: false)

**Example:**
```typescript
import type { LanguageModelV1FunctionTool } from '@ai-sdk/provider';

const vercelTool: LanguageModelV1FunctionTool = {
  type: 'function',
  name: 'search_files',
  description: 'Search for files matching a pattern',
  parameters: {
    type: 'object',
    properties: {
      pattern: {
        type: 'string',
        description: 'Search pattern',
        minLength: 1,
        maxLength: 100
      },
      recursive: {
        type: 'boolean',
        default: false
      }
    },
    required: ['pattern']
  }
};

// Native Gemini schema conversion
const geminiTool = convertVercelToolToGemini(vercelTool);

// JSON Schema fallback
const jsonSchemaTool = convertVercelToolToGemini(vercelTool, true);
```

#### `convertVercelToolsToGemini(tools, useJsonSchema?)`

Converts multiple tools at once.

```typescript
function convertVercelToolsToGemini(
  tools: LanguageModelV1FunctionTool[],
  useJsonSchema?: boolean
): GeminiFunctionDeclaration[]
```

**Example:**
```typescript
const vercelTools = [weatherTool, fileSearchTool, calculatorTool];
const geminiTools = convertVercelToolsToGemini(vercelTools);
```

#### `convertJSONSchemaToGeminiSchema(jsonSchema)`

Converts a JSON Schema to Gemini Schema format.

```typescript
function convertJSONSchemaToGeminiSchema(jsonSchema: JSONSchema7): GeminiSchema
```

**Example:**
```typescript
const jsonSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    age: { type: 'integer', minimum: 0, maximum: 150 }
  },
  required: ['name']
};

const geminiSchema = convertJSONSchemaToGeminiSchema(jsonSchema);
```

### Validation Functions

#### `validateSchemaForGeminiConversion(jsonSchema)`

Validates if a JSON Schema can be successfully converted to Gemini format.

```typescript
function validateSchemaForGeminiConversion(jsonSchema: JSONSchema7): {
  isValid: boolean;
  issues: string[];
}
```

**Example:**
```typescript
const schema = {
  type: 'object',
  properties: {
    user: { $ref: '#/definitions/User' } // Unsupported
  }
};

const validation = validateSchemaForGeminiConversion(schema);
if (!validation.isValid) {
  console.log('Issues found:', validation.issues);
  // Output: ["Unsupported $ref at .user: #/definitions/User"]
}
```

### Utility Functions

#### `createTestTool(name, description, parameters)`

Helper function to create test tools for development and testing.

```typescript
function createTestTool(
  name: string,
  description: string,
  parameters: JSONSchema7
): LanguageModelV1FunctionTool
```

## Type Mapping

### JSON Schema to Gemini Schema Types

| JSON Schema | Gemini Schema | Notes |
|-------------|---------------|-------|
| `string` | `STRING` | |
| `number` | `NUMBER` | |
| `integer` | `INTEGER` | |
| `boolean` | `BOOLEAN` | |
| `array` | `ARRAY` | |
| `object` | `OBJECT` | |
| `null` | `TYPE_UNSPECIFIED` | |
| `['string', 'null']` | `STRING` + `nullable: true` | Nullable types |

### Constraint Mapping

#### String Constraints
```typescript
// JSON Schema
{
  type: 'string',
  minLength: 5,
  maxLength: 100,
  pattern: '^[A-Z]'
}

// Gemini Schema
{
  type: 'STRING',
  minLength: '5',    // Note: string value
  maxLength: '100',  // Note: string value
  pattern: '^[A-Z]'
}
```

#### Number Constraints
```typescript
// JSON Schema
{
  type: 'number',
  minimum: 0,
  maximum: 100,
  exclusiveMinimum: true
}

// Gemini Schema
{
  type: 'NUMBER',
  minimum: 0,
  maximum: 100,
  exclusiveMinimum: true
}
```

#### Array Constraints
```typescript
// JSON Schema
{
  type: 'array',
  items: { type: 'string' },
  minItems: 1,
  maxItems: 10
}

// Gemini Schema
{
  type: 'ARRAY',
  items: { type: 'STRING' },
  minItems: '1',   // Note: string value
  maxItems: '10'   // Note: string value
}
```

### Format Mapping

| JSON Schema Format | Gemini Format |
|-------------------|---------------|
| `email` | `email` |
| `url` | `uri` |
| `uuid` | `uuid` |
| `date-time` | `date-time` |
| `date` | `date` |
| `time` | `time` |
| `ipv4` | `ipv4` |
| `ipv6` | `ipv6` |

## Advanced Usage

### Complex Schema Conversion

```typescript
const complexTool = createTestTool(
  'process_user_data',
  'Process user data with validation',
  {
    type: 'object',
    properties: {
      user: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            minLength: 2,
            maxLength: 50,
            pattern: '^[A-Za-z\\s]+$'
          },
          email: {
            type: 'string',
            format: 'email'
          },
          age: {
            type: 'integer',
            minimum: 13,
            maximum: 120
          },
          preferences: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['email', 'sms', 'push']
            },
            minItems: 1,
            maxItems: 3,
            uniqueItems: true
          }
        },
        required: ['name', 'email']
      },
      options: {
        anyOf: [
          { type: 'null' },
          {
            type: 'object',
            properties: {
              validateOnly: { type: 'boolean', default: false },
              timeout: { type: 'number', minimum: 1000 }
            }
          }
        ]
      }
    },
    required: ['user']
  }
);

const converted = convertVercelToolToGemini(complexTool);
```

### Validation Before Conversion

```typescript
import { validateSchemaForGeminiConversion, convertVercelToolToGemini } from './vercel-to-gemini-converter';

function safeConvertTool(tool: LanguageModelV1FunctionTool) {
  // Validate first
  const validation = validateSchemaForGeminiConversion(tool.parameters);
  
  if (!validation.isValid) {
    console.warn(`Tool ${tool.name} has conversion issues:`, validation.issues);
    
    // Fall back to JSON schema approach
    return convertVercelToolToGemini(tool, true);
  }
  
  // Safe to use native conversion
  return convertVercelToolToGemini(tool, false);
}
```

### Batch Processing

```typescript
function convertToolsWithValidation(tools: LanguageModelV1FunctionTool[]) {
  const results = {
    successful: [] as GeminiFunctionDeclaration[],
    failed: [] as { tool: string; issues: string[] }[]
  };
  
  for (const tool of tools) {
    const validation = validateSchemaForGeminiConversion(tool.parameters);
    
    if (validation.isValid) {
      results.successful.push(convertVercelToolToGemini(tool));
    } else {
      results.failed.push({
        tool: tool.name,
        issues: validation.issues
      });
    }
  }
  
  return results;
}
```

## Supported Features

### ✅ Fully Supported
- All primitive types (`string`, `number`, `integer`, `boolean`)
- Object and array types with full constraint support
- Nullable types (`type: ['string', 'null']`)
- Enum values and const values
- String constraints (length, pattern)
- Number constraints (min/max, exclusive bounds)
- Array constraints (min/max items, unique items)
- Object constraints (required fields, additional properties)
- Union types (`anyOf`, `oneOf`)
- Intersection types (`allOf`) - with property merging
- Format specifications (email, url, date, etc.)
- Default and example values

### ⚠️ Partially Supported
- Tuple arrays (converted to single item type)
- Complex `allOf` schemas (simplified merging)
- Multiple non-null union types (falls back to `TYPE_UNSPECIFIED`)

### ❌ Unsupported
- Schema references (`$ref`)
- Recursive schemas
- Conditional schemas (`if`/`then`/`else`)
- Negation (`not`)
- Complex `additionalProperties` schemas

## Error Handling

The converter gracefully handles unsupported features:

```typescript
// Schema with unsupported features
const problematicSchema = {
  type: 'object',
  properties: {
    data: { $ref: '#/definitions/Data' } // Unsupported
  },
  if: { properties: { type: { const: 'special' } } }, // Unsupported
  then: { required: ['specialField'] }
};

// Validation will catch these issues
const validation = validateSchemaForGeminiConversion(problematicSchema);
console.log(validation.issues);
// Output: [
//   "Unsupported $ref at .data: #/definitions/Data",
//   "Unsupported conditional schema at "
// ]
```

## Integration Examples

### With Gemini AI Provider

```typescript
import { convertVercelToolsToGemini } from './vercel-to-gemini-converter';
import { generateObject } from 'ai';

// Your Vercel AI SDK tools
const vercelTools = [weatherTool, fileSearchTool];

// Convert to Gemini format
const geminiTools = convertVercelToolsToGemini(vercelTools);

// Use with Gemini provider
const result = await generateObject({
  model: geminiModel,
  tools: geminiTools, // Now in correct format
  // ... other options
});
```

### Testing Your Conversions

```typescript
import { describe, test, expect } from 'bun:test';
import { convertVercelToolToGemini, createTestTool } from './vercel-to-gemini-converter';

describe('Tool Conversion Tests', () => {
  test('should convert custom tool correctly', () => {
    const myTool = createTestTool(
      'my_function',
      'Does something useful',
      {
        type: 'object',
        properties: {
          input: { type: 'string', minLength: 1 }
        },
        required: ['input']
      }
    );

    const converted = convertVercelToolToGemini(myTool);
    
    expect(converted.name).toBe('my_function');
    expect(converted.parameters?.type).toBe('OBJECT');
    expect(converted.parameters?.properties?.input?.type).toBe('STRING');
    expect(converted.parameters?.properties?.input?.minLength).toBe('1');
  });
});
```

## Performance Considerations

- Conversion is synchronous and lightweight
- No external dependencies beyond TypeScript types
- Memory usage scales linearly with schema complexity
- Validation is optional and can be skipped for performance-critical paths
- Caching of converted schemas is recommended for repeated use

## Best Practices

1. **Validate First**: Use `validateSchemaForGeminiConversion()` before conversion in production
2. **Handle Failures Gracefully**: Fall back to JSON schema mode for problematic schemas
3. **Test Thoroughly**: Create unit tests for your specific tool conversions
4. **Document Limitations**: Note any unsupported features in your tool documentation
5. **Cache Results**: Cache converted schemas to avoid repeated conversion overhead

Run the tests:
```bash
bun test packages/agents/src/utils/__tests__/vercel-to-gemini-converter.test.ts
```
