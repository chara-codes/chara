# Simple HTML Imports with Chara CLI

The Chara CLI `serveStaticAction` supports Bun-style HTML imports, allowing you to import HTML files directly and serve them as complete applications.

## Quick Start

```typescript
import { serveStaticAction } from '@chara-codes/cli';

// Import your HTML files
import myApp from "./index.html";
import dashboard from "./dashboard.html";

// Use them directly in your server config
const { server } = await serveStaticAction({
  port: 3000,
  directories: {
    "/": myApp,
    "/dashboard": dashboard
  },
  development: true
});
```

## How It Works

1. **Import HTML files** - Use standard ES6 import syntax
2. **Get Response objects** - HTML imports resolve to Response objects
3. **Serve directly** - Pass them to the directories config
4. **Auto-bundling** - Bun handles CSS/JS processing automatically

## Basic Example

### HTML File
```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
    <title>My App</title>
    <link rel="stylesheet" href="./styles.css">
</head>
<body>
    <div id="root">Hello World!</div>
    <script type="module" src="./app.ts"></script>
</body>
</html>
```

### Server Code
```typescript
import { serveStaticAction } from '@chara-codes/cli';
import myApp from "./index.html";

const { server } = await serveStaticAction({
  directories: {
    "/": myApp
  },
  development: true
});
```

## Multiple Routes

```typescript
import { serveStaticAction } from '@chara-codes/cli';
import home from "./home.html";
import about from "./about.html";
import contact from "./contact.html";

const { server } = await serveStaticAction({
  directories: {
    "/": home,
    "/about": about,
    "/contact": contact
  }
});
```

## Mixed with Static Files

```typescript
import { serveStaticAction } from '@chara-codes/cli';
import app from "./app.html";

const { server } = await serveStaticAction({
  directories: {
    "/": app,                    // HTML import
    "/static": "./public",       // Static directory
    "/assets": "./dist/assets"   // Static directory
  }
});
```

## Development vs Production

### Development Mode
```typescript
const { server } = await serveStaticAction({
  directories: {
    "/": myApp
  },
  development: true,  // Enables hot reloading, source maps
});
```

### Production Mode
```typescript
const { server } = await serveStaticAction({
  directories: {
    "/": myApp
  },
  development: false,  // Optimized bundles, caching
});
```

## Advanced Development Options

```typescript
const { server } = await serveStaticAction({
  directories: {
    "/": myApp
  },
  development: {
    hmr: true,        // Hot module reloading
    console: true     // Forward browser console to terminal
  }
});
```

## Framework Support

### React Application
```html
<!-- app.html -->
<!DOCTYPE html>
<html>
<head>
    <title>React App</title>
</head>
<body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
</body>
</html>
```

```tsx
// main.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
```

### Vue Application
```html
<!-- app.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Vue App</title>
</head>
<body>
    <div id="app"></div>
    <script type="module" src="./main.ts"></script>
</body>
</html>
```

```typescript
// main.ts
import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');
```

## Key Benefits

- **Zero Config** - Works out of the box
- **Hot Reloading** - Live updates in development
- **Auto Bundling** - Handles TypeScript, JSX, CSS automatically
- **Framework Agnostic** - Works with React, Vue, vanilla JS
- **Mixed Serving** - Combine with static file serving
- **Production Ready** - Optimized builds with caching

## Common Patterns

### Multi-Page Application
```typescript
import home from "./pages/home.html";
import products from "./pages/products.html";
import checkout from "./pages/checkout.html";

const { server } = await serveStaticAction({
  directories: {
    "/": home,
    "/products": products,
    "/checkout": checkout,
    "/api": "./api-docs",        // Static API docs
    "/assets": "./public/assets"  // Static assets
  }
});
```

### Microservices Frontend
```typescript
import mainApp from "./apps/main/index.html";
import adminApp from "./apps/admin/index.html";
import dashboardApp from "./apps/dashboard/index.html";

const { server } = await serveStaticAction({
  directories: {
    "/": mainApp,
    "/admin": adminApp,
    "/dashboard": dashboardApp
  }
});
```

### Development vs Production Setup
```typescript
const isDev = process.env.NODE_ENV === 'development';

import app from "./index.html";

const { server } = await serveStaticAction({
  directories: {
    "/": app
  },
  development: isDev,
  verbose: isDev
});
```

## Error Handling

```typescript
try {
  import app from "./index.html";
  
  const { server } = await serveStaticAction({
    directories: {
      "/": app
    },
    development: true,
    verbose: true  // Enable detailed logging
  });
  
  console.log(`Server running at ${server.url}`);
} catch (error) {
  console.error('Failed to start server:', error);
}
```

## Troubleshooting

### HTML Import Not Working
- Ensure you're using Bun runtime
- Check that the HTML file exists
- Verify import syntax: `import app from "./file.html"`

### Assets Not Loading
- Check file paths in HTML are relative to the HTML file
- Ensure TypeScript/CSS files exist
- Enable verbose logging for debugging

### Development Features Not Working
- Confirm `development: true` is set
- Check browser console for WebSocket connection
- Verify file changes are being detected

## Examples

See the `examples/` directory for complete working examples:
- `simple-html-imports.ts` - Basic HTML imports demo
- `serve-static-react-app.ts` - React application example

## Migration from Static Files

### Before (Static Files)
```typescript
await serveStaticAction({
  directory: "./public"
});
```

### After (HTML Imports)
```typescript
import app from "./src/index.html";

await serveStaticAction({
  directories: {
    "/": app
  }
});
```

This approach gives you automatic bundling, hot reloading, and modern development features while maintaining the simplicity of static file serving.