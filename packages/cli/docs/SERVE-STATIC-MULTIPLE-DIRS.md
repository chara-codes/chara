# Serving Multiple Directories with Chara CLI

The `serveStaticAction` function now supports serving static files from multiple directories using URL prefixes. This allows you to organize different parts of your application in separate directories while maintaining a clean URL structure.

## Basic Usage

### Single Directory (Traditional)
```typescript
import { serveStaticAction } from '@chara-codes/cli';

const { server, port, url } = await serveStaticAction({
  port: 3000,
  directory: './public'
});
```

### Multiple Directories (New Feature)
```typescript
import { serveStaticAction } from '@chara-codes/cli';

const { server, port, url } = await serveStaticAction({
  port: 3000,
  directories: {
    '/': './public',           // Main site at root
    '/admin': './admin-dist',  // Admin panel at /admin/*
    '/api': './api-docs',      // API documentation at /api/*
    '/assets': './static'      // Static assets at /assets/*
  }
});
```

## How It Works

### URL Mapping
The `directories` option maps URL prefixes to local directory paths:

| URL Request | Directory Mapping | File Served |
|-------------|------------------|-------------|
| `GET /` | `./public/` | `./public/index.html` |
| `GET /admin/` | `./admin-dist/` | `./admin-dist/index.html` |
| `GET /admin/dashboard.html` | `./admin-dist/` | `./admin-dist/dashboard.html` |
| `GET /api/swagger.json` | `./api-docs/` | `./api-docs/swagger.json` |
| `GET /assets/logo.png` | `./static/` | `./static/logo.png` |

### Prefix Priority
When multiple prefixes could match a URL, the **longest prefix wins**:

```typescript
const { server } = await serveStaticAction({
  directories: {
    '/': './public',
    '/api': './api-docs',
    '/api/v1': './api-v1-docs',    // Most specific
    '/api/v2': './api-v2-docs'     // Most specific
  }
});
```

URL resolution:
- `/api/v1/endpoints.json` → `./api-v1-docs/endpoints.json` (matches `/api/v1`)
- `/api/v2/endpoints.json` → `./api-v2-docs/endpoints.json` (matches `/api/v2`)
- `/api/general.json` → `./api-docs/general.json` (matches `/api`)
- `/index.html` → `./public/index.html` (matches `/`)

## Configuration Options

### Complete API
```typescript
interface ServeStaticActionOptions {
  port?: number;                      // Port to serve on (default: 3000)
  directory?: string;                 // Single directory (legacy mode)
  directories?: Record<string, string>; // Multiple directories (new feature)
  index?: string;                     // Index file name (default: "index.html")
  host?: string;                      // Host to bind to (default: "localhost")
  cors?: boolean;                     // Enable CORS (default: true)
  silent?: boolean;                   // Suppress UI output
  verbose?: boolean;                  // Enable detailed logging
}
```

### Key Points
- `directories` option **overrides** the `directory` option when both are provided
- URL prefixes must start with `/`
- Directory paths can be relative or absolute
- All specified directories must exist and be valid directories

## Common Use Cases

### 1. Microservices Frontend
Serve different microfrontends from different builds:

```typescript
await serveStaticAction({
  port: 3000,
  directories: {
    '/': './main-app/dist',
    '/auth': './auth-app/dist',
    '/dashboard': './dashboard-app/dist',
    '/profile': './profile-app/dist'
  }
});
```

### 2. Documentation Site
Serve documentation for different versions:

```typescript
await serveStaticAction({
  port: 3000,
  directories: {
    '/': './docs/latest',
    '/v1': './docs/v1',
    '/v2': './docs/v2',
    '/api': './api-docs'
  }
});
```

### 3. Development Environment
Serve different environments from different builds:

```typescript
await serveStaticAction({
  port: 3000,
  directories: {
    '/': './dist/production',
    '/staging': './dist/staging',
    '/dev': './dist/development',
    '/storybook': './storybook-static'
  }
});
```

## Migration Guide

### From Single Directory
If you're currently using the single directory approach:

```typescript
// Before
await serveStaticAction({
  port: 3000,
  directory: './public'
});

// After (equivalent)
await serveStaticAction({
  port: 3000,
  directories: {
    '/': './public'
  }
});
```

### Adding Additional Directories
To add more directories to an existing setup:

```typescript
// Before
await serveStaticAction({
  port: 3000,
  directory: './public'
});

// After (with additional directories)
await serveStaticAction({
  port: 3000,
  directories: {
    '/': './public',           // Keep existing main site
    '/admin': './admin-dist',  // Add admin panel
    '/api': './api-docs'       // Add API documentation
  }
});
```

## Error Handling

The function validates all directories at startup:

```typescript
try {
  await serveStaticAction({
    directories: {
      '/': './existing-dir',
      '/api': './nonexistent-dir'  // This will cause an error
    }
  });
} catch (error) {
  console.error(error.message);
  // "Directory does not exist for prefix '/api': ./nonexistent-dir"
}
```

## Examples

### Basic Example
```typescript
import { serveStaticAction } from '@chara-codes/cli';

async function startServer() {
  const { server, port, url } = await serveStaticAction({
    port: 3000,
    directories: {
      '/': './public',
      '/admin': './admin-dist',
      '/api': './api-docs'
    },
    verbose: true
  });

  console.log(`Server running at: ${url}`);
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    server.close(() => {
      console.log('Server stopped');
      process.exit(0);
    });
  });
}

startServer();
```

### Advanced Example with Nested Prefixes
```typescript
import { serveStaticAction } from '@chara-codes/cli';

async function startAdvancedServer() {
  const { server, port, url } = await serveStaticAction({
    port: 3000,
    directories: {
      '/': './public',
      '/api': './api-docs',
      '/api/v1': './api-v1-docs',      // More specific than /api
      '/api/v2': './api-v2-docs',      // More specific than /api
      '/admin': './admin',
      '/admin/users': './admin-users'   // More specific than /admin
    },
    index: 'index.html',
    cors: true,
    verbose: true
  });

  console.log(`Advanced server running at: ${url}`);
  console.log('Nested prefixes will be matched by longest-first priority');
}

startAdvancedServer();
```

## Benefits

1. **Organization**: Keep different parts of your application in separate directories
2. **Flexibility**: Serve different builds, versions, or environments from different paths
3. **Maintainability**: Easy to add, remove, or modify sections without affecting others
4. **URL Structure**: Maintain clean and logical URL patterns
5. **Development**: Useful for development environments with multiple apps or services

## Backward Compatibility

The new `directories` option is fully backward compatible. Existing code using the `directory` option will continue to work unchanged.