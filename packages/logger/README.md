# @chara/logger

A flexible and customizable logging utility for Chara applications.

## Features

- Multiple log levels (TRACE, DEBUG, INFO, SUCCESS, WARNING, ERROR, EVENT, SERVER)
- Colorized console output for better readability
- Configurable transports
- Metadata support for detailed logging
- Runtime log level adjustment

## Installation

```bash
npm install @chara/logger
```

## Features

- **Multiple log levels**: TRACE, DEBUG, INFO, SUCCESS, WARNING, ERROR, EVENT, SERVER
- **Configurable transports**: Custom output handlers for different log levels
- **Advanced variable dumping**: Rich, developer-friendly variable inspection
- **Circular reference detection**: Safe handling of complex object structures
- **Type information**: Optional type annotations for better debugging
- **Colored output**: Syntax highlighting for better readability
- **Flexible formatting**: Compact and detailed output modes

## Basic Usage

```typescript
import { logger } from '@chara/logger';

// Use the default logger
logger.info('Application started');
logger.success('Operation completed successfully');
logger.warning('Something might be wrong');
logger.error('An error occurred', { error: 'Details here' });
logger.debug('Debug information');
logger.trace('Detailed trace info');
logger.event('User signed in', { userId: '123' });
logger.server('Server started on port 3000');

// Change log level at runtime
logger.setLevel('DEBUG'); // Only DEBUG and above will be logged
```

## Variable Dumping

The logger includes powerful variable dumping capabilities for inspecting complex data structures with rich formatting:

```typescript
import { logger, dump, dumpToConsole } from '@chara/logger';

// Basic dump - outputs with INFO level
const user = {
  id: 1,
  name: "John Doe",
  preferences: {
    theme: "dark",
    notifications: { email: true, push: false }
  },
  hobbies: ["reading", "coding"],
  lastLogin: new Date()
};

logger.dump(user, "User Object");
// Output:
// ℹ User Object:
// { [Object (keys: 5)]
//   id: 1 [number, integer]
//   name: "John Doe" [string (length: 8)]
//   preferences: { [Object (keys: 2)]
//     theme: "dark" [string (length: 4)]
//     notifications: { [Object (keys: 2)]
//       email: true [boolean]
//       push: false [boolean]
//     }
//   }
//   hobbies: [ [Array (length: 2)]
//     0: "reading" [string (length: 7)]
//     1: "coding" [string (length: 6)]
//   ]
//   lastLogin: 2023-12-01T10:30:00.000Z [Date]
// }

// Different dump methods for different log levels
logger.dumpError(errorData, "Error Details");     // ERROR level
logger.dumpDebug(debugInfo, "Debug Info");        // DEBUG level  
logger.dumpCompact(stats, "Quick Stats");         // Compact format

// Standalone dump functions
console.log(dump(data));                          // Direct output
dumpToConsole(data, "Label", { colors: false });  // Console output with options

// Dump with custom options
logger.dump(data, "Custom", {
  maxDepth: 3,
  showTypes: false,
  compact: true,
  colors: false
});
```

### Dump Features

- **All Data Types**: Handles primitives, objects, arrays, Maps, Sets, functions, errors, etc.
- **Circular References**: Safely detects and displays circular references
- **Type Information**: Shows data types and additional info (string length, array size, etc.)
- **Depth Control**: Configurable maximum depth to prevent overwhelming output
- **Color Support**: Syntax highlighting for better readability
- **Compact Mode**: Condensed output for simple data structures
- **Custom Labels**: Add descriptive labels to dump output

## Creating a Custom Logger

```typescript
import { Logger, LogLevel } from '@chara/logger';

// Create a custom logger
const customLogger = new Logger({
  name: 'MyService',
  levels: [LogLevel.INFO, LogLevel.WARNING, LogLevel.ERROR], // Only enable these levels
});

customLogger.info('This will be logged');
customLogger.debug('This will NOT be logged'); // DEBUG level not enabled
```

## Custom Transports

```typescript
import { Logger, LogLevel, TransportType } from '@chara/logger';

// Create a custom transport
const fileTransport: TransportType = (level, message, metadata) => {
  // Implementation for writing to a file
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    metadata
  };

  // Write to file (implementation details omitted)
  console.log(`[File Transport] Would write: ${JSON.stringify(logEntry)}`);
};

// Create logger with custom transport
const fileLogger = new Logger({
  name: 'FileLogger',
  transports: {
    [LogLevel.ERROR]: [fileTransport],  // Only errors go to file
  }
});

fileLogger.error('This error will be sent to the file transport');
```

## API Reference

### Log Levels

The logger supports the following levels (in order of increasing severity):

- `TRACE`: Most verbose level for detailed tracing
- `DEBUG`: Debug information for development
- `INFO`: General information
- `SUCCESS`: Successful operations
- `WARNING`: Warnings that don't prevent operation
- `ERROR`: Errors that might prevent proper operation
- `EVENT`: Special events in the application
- `SERVER`: Server-related information

### Methods

- `debug(message: string, metadata?: any)`: Log at DEBUG level
- `trace(message: string, metadata?: any)`: Log at TRACE level
- `info(message: string, metadata?: any)`: Log at INFO level
- `success(message: string, metadata?: any)`: Log at SUCCESS level
- `warning(message: string, metadata?: any)`: Log at WARNING level
- `error(message: string, metadata?: any)`: Log at ERROR level
- `event(message: string, metadata?: any)`: Log at EVENT level
- `server(message: string, metadata?: any)`: Log at SERVER level
- `setLevel(level: string)`: Set minimum log level
- `getLevel(): string`: Get current log level

### Dump Methods

- `dump(data: unknown, label?: string, options?: DumpOptions)`: Dump variable with INFO level
- `dumpError(data: unknown, label?: string)`: Dump variable with ERROR level  
- `dumpDebug(data: unknown, label?: string)`: Dump variable with DEBUG level
- `dumpCompact(data: unknown, label?: string)`: Dump variable in compact format

### Standalone Dump Functions

- `dump(data: unknown, options?: DumpOptions)`: Direct dump without logger
- `dumpToConsole(data: unknown, label?: string, options?: DumpOptions)`: Console dump
- `Dumper`: Class for creating custom dumpers with specific options

### DumpOptions

```typescript
interface DumpOptions {
  maxDepth?: number;        // Maximum nesting depth (default: 5)
  maxArrayLength?: number;  // Maximum array items shown (default: 100)
  maxStringLength?: number; // Maximum string length (default: 200)
  showTypes?: boolean;      // Show type information (default: true)
  colors?: boolean;         // Enable colored output (default: true)
  indent?: string;          // Indentation string (default: "  ")
  compact?: boolean;        // Use compact format (default: false)
}
```

## License

MIT
