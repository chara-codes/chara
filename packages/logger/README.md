# @chara-codes/logger

A flexible and powerful logging utility for Chara applications built on top of [Pino](https://github.com/pinojs/pino), featuring advanced object pretty-printing with [@base2/pretty-print-object](https://www.npmjs.com/package/@base2/pretty-print-object) and multiple transport support.

## Features

- 🚀 **High Performance**: Built on Pino, one of the fastest Node.js loggers
- 🎨 **Multiple Transports**: Console, file, and browser console support
- 🔍 **Advanced Object Printing**: Beautiful object formatting with [@base2/pretty-print-object](https://www.npmjs.com/package/@base2/pretty-print-object) and circular reference handling
- 🎯 **Custom Log Levels**: Success, event, and server levels in addition to standard levels
- 🌈 **Colorized Output**: Beautiful console output with customizable colors
- 🔧 **TypeScript Support**: Full TypeScript definitions included
- 📦 **Zero Config**: Works out of the box with sensible defaults

## Installation

```bash
npm install @chara-codes/logger
# or
bun add @chara-codes/logger
```

## Quick Start

```typescript
import { logger } from '@chara-codes/logger';

// Basic logging
logger.info('Application started');
logger.success('Operation completed successfully');
logger.warning('This is a warning');
logger.error('Something went wrong');

// Object-style logging
logger.info({ userId: 123, action: 'login' }, 'User logged in');

// Advanced data dumping
const complexData = {
  user: { name: 'John', settings: { theme: 'dark' } },
  items: [1, 2, 3]
};
logger.dump(complexData, 'Complex Data Structure');
```

## API Reference

### Logger Class

#### Constructor

```typescript
const logger = new Logger(config: LoggerConfig);
```

#### LoggerConfig

```typescript
interface LoggerConfig {
  name: string;                           // Logger name
  level?: string;                         // Log level (default: 'info')
  transports?: LoggerTransportConfig[];   // Transport configurations
  formatters?: object;                    // Pino formatters
  serializers?: object;                   // Pino serializers
  redact?: string[] | object;             // Fields to redact
}
```

#### Transport Configuration

```typescript
interface LoggerTransportConfig {
  type: 'console' | 'file' | 'browser';
  options?: {
    // Console transport options
    colorize?: boolean;
    translateTime?: boolean | string;
    
    // File transport options
    destination?: string;
    mkdir?: boolean;
    
    // Browser transport options
    asObject?: boolean;
  };
}
```

### Log Levels

The logger supports all standard Pino levels plus custom Chara levels:

- `trace()` - Trace level (lowest)
- `debug()` - Debug information
- `info()` - General information
- `success()` - Success messages (custom)
- `warn()` / `warning()` - Warning messages
- `error()` / `err()` - Error messages
- `fatal()` - Fatal errors (highest)
- `event()` - Event messages (custom)
- `server()` - Server messages (custom)

### Dump Methods

Advanced object pretty-printing methods using [@base2/pretty-print-object](https://www.npmjs.com/package/@base2/pretty-print-object):

```typescript
// Standard dump with full details
logger.dump(data, 'Optional Label');

// Compact dump for simple data (higher inline character limit)
logger.dumpCompact(data, 'Compact Data');

// Debug-level dump (only shows if debug level is enabled)
logger.dumpDebug(data, 'Debug Info');

// Error-level dump
logger.dumpError(data, 'Error Details');

// Dump with custom pretty-print options
logger.dump(data, 'Custom Format', {
  singleQuotes: false,
  inlineCharacterLimit: 50,
  indent: '    '
});
```

## Usage Examples

### 1. Console Transport (Default)

```typescript
import { Logger } from '@chara-codes/logger';

const logger = new Logger({
  name: 'my-app',
  level: 'debug',
  transports: [{ 
    type: 'console', 
    options: { colorize: true } 
  }]
});

logger.info('Console message');
```

### 2. File Transport

```typescript
const fileLogger = new Logger({
  name: 'file-app',
  transports: [{ 
    type: 'file', 
    options: { 
      destination: './logs/app.log',
      mkdir: true 
    } 
  }]
});

fileLogger.info('This goes to file');
```

### 3. Multiple Transports

```typescript
const multiLogger = new Logger({
  name: 'multi-app',
  transports: [
    { type: 'console', options: { colorize: true } },
    { type: 'file', options: { destination: './logs/app.log' } }
  ]
});

multiLogger.info('This goes to both console and file');
```

### 4. Child Loggers

```typescript
const childLogger = logger.child({ 
  requestId: 'req-123', 
  module: 'auth' 
});

childLogger.info('Processing request'); // Includes context
```

### 5. Object-Style Logging

```typescript
// Structured logging
logger.info({ 
  userId: 456, 
  action: 'purchase',
  amount: 99.99 
}, 'Purchase completed');

// Error with context
logger.error({ 
  error: 'Database timeout',
  query: 'SELECT * FROM users',
  duration: 5000 
}, 'Query failed');
```

### 6. Advanced Object Pretty-Printing

```typescript
const complexObject = {
  user: {
    id: 123,
    profile: {
      name: 'John Doe',
      preferences: {
        theme: 'dark',
        notifications: true
      }
    }
  },
  metadata: {
    timestamp: new Date(),
    version: '1.0.0'
  },
  items: [1, 2, 3, 4, 5]
};

// Full dump with beautiful formatting
logger.dump(complexObject, 'User Data');
// Output:
// User Data:
// {
//   user: {
//     id: 123,
//     name: 'John Doe',
//     profile: {settings: {theme: 'dark', notifications: true}}
//   },
//   items: [1, 2, 3, 4, 5],
//   timestamp: new Date('2025-08-07T13:03:45.643Z'),
//   metadata: {version: '1.0.0', environment: 'development'}
// }

// Compact dump for simple display (inline when possible)
logger.dumpCompact({ status: 'ok', count: 42 });
// Output: {status: 'ok', count: 42}

// Custom formatting options
logger.dump(complexObject, 'Custom Format', {
  singleQuotes: false,
  inlineCharacterLimit: 50,
  indent: '    '
});

// Debug dump (only shows if debug level is enabled)
logger.dumpDebug(someVariable, 'Debug Variable');
```

### 7. Circular Reference Handling

```typescript
const obj = { name: 'test' };
obj.self = obj; // Circular reference

logger.dump(obj); // Safely handles circular references
// Output: {name: 'test', self: "[Circular]"}
```

### 8. Direct Pretty-Print Usage

```typescript
import { prettyPrint } from '@chara-codes/logger';

// Use pretty-print-object directly
const formatted = prettyPrint({ hello: 'world', numbers: [1, 2, 3] }, {
  singleQuotes: true,
  inlineCharacterLimit: 30
});
console.log(formatted);
// Output:
// {
//   hello: 'world',
//   numbers: [1, 2, 3]
// }
```

## Transport Details

### Console Transport

The console transport uses `pino-pretty` for beautiful, colorized output:

```typescript
{
  type: 'console',
  options: {
    colorize: true,                    // Enable colors
    translateTime: 'SYS:standard',     // Time format
    ignore: 'pid,hostname',            // Fields to ignore
    customColors: 'info:cyan,warn:yellow,error:red'
  }
}
```

### File Transport

The file transport writes structured JSON logs to files:

```typescript
{
  type: 'file',
  options: {
    destination: './logs/app.log',     // Log file path
    mkdir: true                        // Create directory if needed
  }
}
```

### Browser Transport

For browser environments:

```typescript
{
  type: 'browser',
  options: {
    asObject: false                    // Output format
  }
}
```

## Level Management

```typescript
// Set log level
logger.setLevel('debug');

// Get current level
const currentLevel = logger.getLevel(); // Returns: 'debug'

// Only messages at or above the set level will be output
logger.setLevel('warn');
logger.debug('Not shown');  // Won't appear
logger.warn('Shown');       // Will appear
logger.error('Shown');      // Will appear
```

## Access to Underlying Pino Logger

```typescript
// Access the underlying Pino logger for advanced usage
const pinoLogger = logger.pino;
pinoLogger.info('Direct Pino call');
```

## Migration from Previous Version

The new Pino-based logger maintains backward compatibility:

```typescript
// Old usage still works
import { logger } from '@chara-codes/logger';
logger.info('Still works');
logger.dump(data, 'Still works');

// New features available
const customLogger = new Logger({
  name: 'my-app',
  transports: [{ type: 'console' }]
});
```

## Performance

Built on Pino, this logger offers:
- Extremely fast JSON logging
- Minimal overhead
- Efficient transport system
- Optimized for production use

## License

Apache License 2.0

Copyright (c) 2025 Chara Codes

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

See the main [LICENSE](../../LICENSE) file for details.