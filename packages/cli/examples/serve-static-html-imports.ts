#!/usr/bin/env node

import { serveStaticAction } from "../src/actions/serve-static";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

/**
 * Example: Using HTML imports with serve-static
 *
 * This example demonstrates how to use Bun-style HTML imports
 * with the serveStaticAction function for full-stack applications.
 */

// Create example files if they don't exist
function createExampleFiles() {
  const exampleDir = join(process.cwd(), "example-html-imports");

  if (!existsSync(exampleDir)) {
    mkdirSync(exampleDir, { recursive: true });
  }

  // Create index.html
  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Home - HTML Imports Demo</title>
    <link rel="stylesheet" href="./styles.css">
</head>
<body>
    <div id="root">
        <h1>Welcome to HTML Imports Demo</h1>
        <nav>
            <a href="/">Home</a>
            <a href="/dashboard">Dashboard</a>
            <a href="/about">About</a>
        </nav>
        <main>
            <p>This page demonstrates HTML imports with static file serving.</p>
            <button id="clickMe">Click me!</button>
        </main>
    </div>
    <script type="module" src="./app.js"></script>
</body>
</html>`;

  // Create dashboard.html
  const dashboardHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - HTML Imports Demo</title>
    <link rel="stylesheet" href="./styles.css">
    <link rel="stylesheet" href="./dashboard.css">
</head>
<body>
    <div id="root">
        <h1>Dashboard</h1>
        <nav>
            <a href="/">Home</a>
            <a href="/dashboard">Dashboard</a>
            <a href="/about">About</a>
        </nav>
        <main>
            <div class="dashboard-grid">
                <div class="card">
                    <h2>Users</h2>
                    <p>Total: <span id="user-count">0</span></p>
                </div>
                <div class="card">
                    <h2>Revenue</h2>
                    <p>$<span id="revenue">0</span></p>
                </div>
                <div class="card">
                    <h2>Orders</h2>
                    <p><span id="order-count">0</span></p>
                </div>
            </div>
        </main>
    </div>
    <script type="module" src="./dashboard.js"></script>
</body>
</html>`;

  // Create about.html
  const aboutHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>About - HTML Imports Demo</title>
    <link rel="stylesheet" href="./styles.css">
</head>
<body>
    <div id="root">
        <h1>About</h1>
        <nav>
            <a href="/">Home</a>
            <a href="/dashboard">Dashboard</a>
            <a href="/about">About</a>
        </nav>
        <main>
            <p>This is an example of serving HTML files with bundling support.</p>
            <h2>Features</h2>
            <ul>
                <li>HTML imports</li>
                <li>CSS bundling</li>
                <li>JavaScript bundling</li>
                <li>Development mode with hot reloading</li>
                <li>Production mode with minification</li>
            </ul>
        </main>
    </div>
    <script type="module" src="./about.js"></script>
</body>
</html>`;

  // Create styles.css
  const stylesCss = `
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    margin: 0;
    padding: 0;
    background-color: #f5f5f5;
}

#root {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

h1 {
    color: #2c3e50;
    margin-bottom: 20px;
}

nav {
    background: #3498db;
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 20px;
}

nav a {
    color: white;
    text-decoration: none;
    margin-right: 20px;
    padding: 8px 16px;
    border-radius: 4px;
    transition: background-color 0.3s;
}

nav a:hover {
    background-color: rgba(255, 255, 255, 0.2);
}

main {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

button {
    background: #3498db;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s;
}

button:hover {
    background: #2980b9;
}
`;

  // Create dashboard.css
  const dashboardCss = `
.dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
}

.card {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #e9ecef;
    text-align: center;
}

.card h2 {
    color: #495057;
    margin-bottom: 10px;
}

.card p {
    font-size: 18px;
    color: #6c757d;
}

.card span {
    font-weight: bold;
    color: #28a745;
}
`;

  // Create app.js
  const appJs = `
document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('clickMe');
    if (button) {
        button.addEventListener('click', () => {
            alert('Hello from HTML imports!');
        });
    }
});
`;

  // Create dashboard.js
  const dashboardJs = `
document.addEventListener('DOMContentLoaded', () => {
    // Simulate loading dashboard data
    setTimeout(() => {
        document.getElementById('user-count').textContent = '1,234';
        document.getElementById('revenue').textContent = '56,789';
        document.getElementById('order-count').textContent = '89';
    }, 500);
});
`;

  // Create about.js
  const aboutJs = `
document.addEventListener('DOMContentLoaded', () => {
    console.log('About page loaded');
});
`;

  // Write files
  writeFileSync(join(exampleDir, "index.html"), indexHtml);
  writeFileSync(join(exampleDir, "dashboard.html"), dashboardHtml);
  writeFileSync(join(exampleDir, "about.html"), aboutHtml);
  writeFileSync(join(exampleDir, "styles.css"), stylesCss);
  writeFileSync(join(exampleDir, "dashboard.css"), dashboardCss);
  writeFileSync(join(exampleDir, "app.js"), appJs);
  writeFileSync(join(exampleDir, "dashboard.js"), dashboardJs);
  writeFileSync(join(exampleDir, "about.js"), aboutJs);

  return exampleDir;
}

/**
 * Example 1: Basic HTML imports setup
 */
async function basicHTMLImports() {
  console.log("🌐 Starting basic HTML imports example...\n");

  const exampleDir = createExampleFiles();

  try {
    const { server, port, url } = await serveStaticAction({
      port: 3000,
      directories: {
        "/": join(exampleDir, "index.html"),
        "/dashboard": join(exampleDir, "dashboard.html"),
        "/about": join(exampleDir, "about.html"),
      },
      development: true,
      bundling: {
        enabled: true,
        sourcemap: true,
        minify: false,
      },
      verbose: true,
    });

    console.log(`✅ Server running at: ${url}`);
    console.log("\nHTML Import Routes:");
    console.log("• http://localhost:3000/         -> index.html");
    console.log("• http://localhost:3000/dashboard -> dashboard.html");
    console.log("• http://localhost:3000/about    -> about.html");

    console.log("\n📝 Features enabled:");
    console.log("• HTML imports with bundling");
    console.log("• Development mode (source maps, no minification)");
    console.log("• CSS processing");
    console.log("• JavaScript bundling");

    // Graceful shutdown
    process.on("SIGINT", async () => {
      console.log("\n🛑 Shutting down server...");
      server.close(() => {
        console.log("✅ Server stopped successfully");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

/**
 * Example 2: Mixed HTML imports and static directories
 */
async function mixedExample() {
  console.log(
    "🚀 Starting mixed HTML imports + static directories example...\n"
  );

  const exampleDir = createExampleFiles();

  try {
    const { server, port, url } = await serveStaticAction({
      port: 3001,
      directories: {
        "/": join(exampleDir, "index.html"), // HTML import
        "/dashboard": join(exampleDir, "dashboard.html"), // HTML import
        "/static": exampleDir, // Static directory
        "/public": "./public", // Another static directory
      },
      development: {
        hmr: true,
        console: true,
      },
      bundling: {
        enabled: true,
        cache: true,
        minify: false,
      },
      verbose: true,
    });

    console.log(`✅ Mixed server running at: ${url}`);
    console.log("\nRoute Mapping:");
    console.log("• /                -> HTML import (index.html)");
    console.log("• /dashboard       -> HTML import (dashboard.html)");
    console.log("• /static/*        -> Static directory");
    console.log("• /public/*        -> Static directory");

    console.log("\n📝 Features enabled:");
    console.log("• HTML imports with bundling");
    console.log("• Static file serving");
    console.log("• Hot module reloading");
    console.log("• Console log forwarding");
    console.log("• Asset caching");

    // Graceful shutdown
    process.on("SIGINT", async () => {
      console.log("\n🛑 Shutting down mixed server...");
      server.close(() => {
        console.log("✅ Mixed server stopped successfully");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("❌ Failed to start mixed server:", error);
    process.exit(1);
  }
}

/**
 * Example 3: Production mode with minification
 */
async function productionExample() {
  console.log("📦 Starting production mode example...\n");

  const exampleDir = createExampleFiles();

  try {
    const { server, port, url } = await serveStaticAction({
      port: 3002,
      directories: {
        "/": join(exampleDir, "index.html"),
        "/dashboard": join(exampleDir, "dashboard.html"),
        "/about": join(exampleDir, "about.html"),
      },
      development: false,
      bundling: {
        enabled: true,
        minify: true,
        sourcemap: false,
        cache: true,
      },
      verbose: true,
    });

    console.log(`✅ Production server running at: ${url}`);
    console.log("\n📝 Production features:");
    console.log("• Asset minification");
    console.log("• Content caching");
    console.log("• Optimized bundling");
    console.log("• No source maps");

    // Graceful shutdown
    process.on("SIGINT", async () => {
      console.log("\n🛑 Shutting down production server...");
      server.close(() => {
        console.log("✅ Production server stopped successfully");
        process.exit(0);
      });
    });
  } catch (error) {
    console.error("❌ Failed to start production server:", error);
    process.exit(1);
  }
}

// Run examples based on command line argument
const example = process.argv[2] || "basic";

switch (example) {
  case "basic":
    basicHTMLImports();
    break;
  case "mixed":
    mixedExample();
    break;
  case "production":
    productionExample();
    break;
  default:
    console.log(
      "Usage: node serve-static-html-imports.ts [basic|mixed|production]"
    );
    console.log("\nExamples:");
    console.log("• basic      - Basic HTML imports with bundling");
    console.log("• mixed      - HTML imports + static directories");
    console.log("• production - Production mode with minification");
    process.exit(1);
}
