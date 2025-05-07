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
bun install @chara/logger
```

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

## License

MIT
