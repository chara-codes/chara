# HTML Imports with Chara CLI

The Chara CLI `serveStaticAction` function supports Bun-style HTML imports, enabling you to build full-stack applications with automatic bundling, hot reloading, and optimized asset serving.

## Overview

HTML imports allow you to import HTML files directly in your server code and serve them as bundled applications. This feature bridges the gap between static file serving and modern frontend development workflows.

```typescript
import { serveStaticAction } from '@chara-codes/cli';

// Import HTML files directly
const dashboard = await import("./dashboard.html");
const homepage = await import("./index.html");

const { server } = await serveStaticAction({
  port: 3000,
  directories: {
    "/": homepage,
    "/dashboard": dashboard,
  },
  development: true
});
```

## How It Works

When you import an HTML file or pass it to the `directories` option, the server:

1. **Scans HTML** - Uses HTMLRewriter to find `<script>` and `<link>` tags
2. **Bundles Assets** - Processes JavaScript, TypeScript, CSS, and other assets
3. **Generates Manifests** - Creates asset manifests with content-addressable hashes
4. **Serves Optimized** - Serves bundled assets with proper caching headers

## Basic Usage

### Single HTML File

```typescript
import { serveStaticAction } from '@chara-codes/cli';

const { server } = await serveStaticAction({
  port: 3000,
  directories: {
    "/": "./src/index.html"
  },
  development: true
});
```

### Multiple HTML Routes

```typescript
const { server } = await serveStaticAction({
  port: 3000,
  directories: {
    "/": "./src/index.html",
    "/dashboard": "./src/dashboard.html",
    "/admin": "./src/admin.html"
  },
  development: true
});
```

### Mixed HTML and Static Files

```typescript
const { server } = await serveStaticAction({
  port: 3000,
  directories: {
    "/": "./src/index.html",           // HTML import
    "/dashboard": "./src/dashboard.html", // HTML import
    "/static": "./public",             // Static directory
    "/assets": "./dist/assets"         // Static directory
  },
  development: true
});
```

## Configuration Options

### Development Mode

Enable development features for faster iteration:

```typescript
const { server } = await serveStaticAction({
  directories: {
    "/": "./src/index.html"
  },
  development: true,
  // OR with detailed config
  development: {
    hmr: true,      // Hot module reloading
    console: true   // Forward browser console to terminal
  }
});
```

Development mode enables:
- Source maps for debugging
- Hot module reloading (HMR)
- Browser console forwarding
- Detailed error messages
- No minification
- Real-time asset rebuilding

### Production Mode

Optimize for production deployment:

```typescript
const { server } = await serveStaticAction({
  directories: {
    "/": "./src/index.html"
  },
  development: false,
  bundling: {
    enabled: true,
    minify: true,
    sourcemap: false,
    cache: true
  }
});
```

Production mode enables:
- Asset minification
- Content caching
- Optimized bundling
- ETag headers
- Gzip compression

### Bundling Configuration

Fine-tune bundling behavior:

```typescript
const { server } = await serveStaticAction({
  directories: {
    "/": "./src/index.html"
  },
  bundling: {
    enabled: true,        // Enable/disable bundling
    minify: false,        // Minify assets
    sourcemap: true,      // Generate source maps
    cache: true          // Cache bundled assets
  }
});
```

### Plugin Support

Add bundler plugins for extended functionality:

```typescript
const { server } = await serveStaticAction({
  directories: {
    "/": "./src/index.html"
  },
  plugins: [
    "bun-plugin-tailwind",
    "./custom-plugin.js"
  ],
  development: true
});
```

## HTML File Structure

Your HTML files can include standard web assets:

```html
<!-- src/index.html -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>My App</title>
    
    <!-- CSS files are bundled -->
    <link rel="stylesheet" href="./styles.css">
    <link rel="stylesheet" href="./components.css">
</head>
<body>
    <div id="root"></div>
    
    <!-- JavaScript/TypeScript files are bundled -->
    <script type="module" src="./app.ts"></script>
    <script type="module" src="./components/index.js"></script>
</body>
</html>
```

## Asset Processing

### JavaScript/TypeScript

```typescript
// app.ts - Automatically transpiled and bundled
import { createApp } from './lib/app';
import './styles.css';

const app = createApp();
app.mount('#root');
```

### CSS Processing

```css
/* styles.css - Automatically processed */
@import url('./base.css');
@import url('./components.css');

body {
    font-family: system-ui, sans-serif;
    margin: 0;
    padding: 0;
}

/* CSS modules and PostCSS supported */
.container {
    max-width: 1200px;
    margin: 0 auto;
}
```

### Asset References

```html
<!-- Images and other assets -->
<img src="./assets/logo.png" alt="Logo">
<link rel="icon" href="./assets/favicon.ico">
```

## Framework Integration

### React Application

```typescript
// app.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './components/App';
import './styles.css';

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
```

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
    <title>React App</title>
</head>
<body>
    <div id="root"></div>
    <script type="module" src="./app.tsx"></script>
</body>
</html>
```

### Vue Application

```typescript
// app.ts
import { createApp } from 'vue';
import App from './App.vue';
import './styles.css';

createApp(App).mount('#app');
```

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Vue App</title>
</head>
<body>
    <div id="app"></div>
    <script type="module" src="./app.ts"></script>
</body>
</html>
```

## Advanced Features

### Hot Module Reloading

When `development.hmr` is enabled:

```typescript
const { server } = await serveStaticAction({
  directories: {
    "/": "./src/index.html"
  },
  development: {
    hmr: true
  }
});
```

Changes to your source files will automatically update in the browser without a full page reload.

### Console Forwarding

Forward browser console logs to your terminal:

```typescript
const { server } = await serveStaticAction({
  directories: {
    "/": "./src/index.html"
  },
  development: {
    console: true
  }
});
```

### Custom Plugins

Create custom bundler plugins:

```typescript
// tailwind-plugin.js
export default {
  name: 'tailwind-processor',
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, async (args) => {
      // Process CSS with Tailwind
      const result = await processTailwind(args.path);
      return {
        contents: result.css,
        loader: 'css'
      };
    });
  }
};
```

## Error Handling

### Graceful Degradation

If bundling fails, the server falls back to serving files directly:

```typescript
const { server } = await serveStaticAction({
  directories: {
    "/": "./src/index.html"  // Will serve directly if bundling fails
  },
  verbose: true  // Enable detailed error logging
});
```

### Development Error Pages

In development mode, detailed error information is displayed:

```typescript
const { server } = await serveStaticAction({
  directories: {
    "/": "./src/index.html"
  },
  development: true  // Shows detailed error pages
});
```

## Performance Considerations

### Caching

```typescript
const { server } = await serveStaticAction({
  directories: {
    "/": "./src/index.html"
  },
  bundling: {
    cache: true  // Cache bundled assets
  }
});
```

### Asset Optimization

```typescript
const { server } = await serveStaticAction({
  directories: {
    "/": "./src/index.html"
  },
  development: false,
  bundling: {
    minify: true,     // Minify assets
    sourcemap: false  // Disable source maps for production
  }
});
```

## Migration Guide

### From Static Files

Before:
```typescript
const { server } = await serveStaticAction({
  directory: "./public"
});
```

After:
```typescript
const { server } = await serveStaticAction({
  directories: {
    "/": "./src/index.html"  // HTML import with bundling
  },
  development: true
});
```

### From Build Tools

Replace complex build setups:

Before:
```json
{
  "scripts": {
    "build": "webpack --mode=production",
    "dev": "webpack-dev-server"
  }
}
```

After:
```typescript
// Single command handles bundling and serving
const { server } = await serveStaticAction({
  directories: {
    "/": "./src/index.html"
  },
  development: process.env.NODE_ENV === 'development'
});
```

## Best Practices

### 1. Organize Assets

```
src/
├── index.html
├── dashboard.html
├── styles/
│   ├── base.css
│   └── components.css
├── scripts/
│   ├── app.ts
│   └── utils.ts
└── assets/
    ├── images/
    └── fonts/
```

### 2. Use Development Mode

```typescript
const isDev = process.env.NODE_ENV === 'development';

const { server } = await serveStaticAction({
  directories: {
    "/": "./src/index.html"
  },
  development: isDev,
  bundling: {
    minify: !isDev,
    sourcemap: isDev
  }
});
```

### 3. Configure Plugins

```typescript
// bunfig.toml
[serve.static]
plugins = [
  "bun-plugin-tailwind",
  "./plugins/custom-processor.js"
]
```

### 4. Handle Errors Gracefully

```typescript
try {
  const { server } = await serveStaticAction({
    directories: {
      "/": "./src/index.html"
    },
    development: true,
    verbose: true
  });
} catch (error) {
  console.error('Server failed to start:', error);
  process.exit(1);
}
```

## Troubleshooting

### Common Issues

**Bundling Fails:**
- Check file paths in HTML references
- Ensure TypeScript/JavaScript syntax is valid
- Verify CSS imports are correct

**Assets Not Loading:**
- Check network tab in browser dev tools
- Verify file paths are relative to HTML file
- Ensure development mode is enabled for debugging

**Hot Reload Not Working:**
- Confirm `development.hmr` is enabled
- Check browser console for WebSocket connections
- Verify file changes are being detected

### Debug Mode

```typescript
const { server } = await serveStaticAction({
  directories: {
    "/": "./src/index.html"
  },
  development: {
    hmr: true,
    console: true
  },
  verbose: true  // Enable detailed logging
});
```

## Examples

See the `examples/` directory for complete working examples:

- `serve-static-html-imports.ts` - Basic HTML imports
- `serve-static-react-app.ts` - React application
- `serve-static-vue-app.ts` - Vue application
- `serve-static-mixed.ts` - Mixed HTML and static files

## API Reference

### ServeStaticActionOptions

```typescript
interface ServeStaticActionOptions {
  port?: number;
  directories?: Record<string, string | HTMLImportManifest>;
  development?: boolean | {
    hmr?: boolean;
    console?: boolean;
  };
  bundling?: {
    enabled?: boolean;
    minify?: boolean;
    sourcemap?: boolean;
    cache?: boolean;
  };
  plugins?: string[];
  verbose?: boolean;
  silent?: boolean;
}
```

### HTMLImportManifest

```typescript
interface HTMLImportManifest {
  index: string;
  files: Array<{
    input: string;
    path: string;
    loader: string;
    isEntry: boolean;
    headers: Record<string, string>;
  }>;
}
```

## Future Enhancements

- Integration with `bun build` CLI
- Advanced plugin ecosystem
- Server-side rendering support
- Progressive Web App features
- Enhanced caching strategies

---

For more information, see the [Bun documentation on HTML imports](https://bun.sh/docs/api/http#html-imports).