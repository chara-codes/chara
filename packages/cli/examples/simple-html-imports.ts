#!/usr/bin/env node

import { serveStaticAction } from "../src/actions/serve-static";

/**
 * Simple HTML Imports Example
 *
 * This example demonstrates how to use HTML imports exactly like Bun.serve():
 * 1. Import HTML files with `import myApp from "./index.html"`
 * 2. Use them directly in the directories config: {"/": myApp}
 */

// Import HTML files - these will be Response objects when using Bun
// For this example, we'll simulate them as Response objects
const homeApp = new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Home - HTML Imports</title>
    <style>
        body {
            font-family: system-ui, sans-serif;
            max-width: 800px;
            margin: 2rem auto;
            padding: 1rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .container {
            background: rgba(255,255,255,0.1);
            padding: 2rem;
            border-radius: 1rem;
            backdrop-filter: blur(10px);
        }
        h1 { color: #fff; margin-bottom: 1rem; }
        p { line-height: 1.6; margin-bottom: 1rem; }
        nav a {
            color: #fff;
            text-decoration: none;
            margin-right: 1rem;
            padding: 0.5rem 1rem;
            border: 1px solid rgba(255,255,255,0.3);
            border-radius: 0.5rem;
            transition: all 0.3s;
        }
        nav a:hover {
            background: rgba(255,255,255,0.2);
            transform: translateY(-2px);
        }
        .feature {
            background: rgba(255,255,255,0.1);
            padding: 1rem;
            margin: 1rem 0;
            border-radius: 0.5rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏠 Home - HTML Imports Demo</h1>
        <nav>
            <a href="/">Home</a>
            <a href="/dashboard">Dashboard</a>
            <a href="/about">About</a>
        </nav>

        <div class="feature">
            <h2>Welcome to HTML Imports!</h2>
            <p>This page was imported directly as a Response object and served through Chara CLI.</p>
            <p>Key features:</p>
            <ul>
                <li>Import HTML files with <code>import app from "./index.html"</code></li>
                <li>Use them directly: <code>{"/": app}</code></li>
                <li>Automatic bundling and optimization</li>
                <li>Hot reloading in development mode</li>
            </ul>
        </div>

        <script>
            console.log('🎉 Home page loaded successfully!');

            // Add some interactivity
            document.addEventListener('DOMContentLoaded', () => {
                const features = document.querySelectorAll('.feature');
                features.forEach((feature, index) => {
                    feature.style.animationDelay = (index * 0.2) + 's';
                    feature.style.animation = 'fadeInUp 0.6s ease forwards';
                });
            });

            // Add CSS animation
            const style = document.createElement('style');
            style.textContent = \`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(30px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .feature { opacity: 0; }
            \`;
            document.head.appendChild(style);
        </script>
    </div>
</body>
</html>`, {
    headers: { 'Content-Type': 'text/html' }
});

const dashboardApp = new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - HTML Imports</title>
    <style>
        body {
            font-family: system-ui, sans-serif;
            margin: 0;
            background: #f5f7fa;
        }
        .header {
            background: #2c3e50;
            color: white;
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .nav a {
            color: #ecf0f1;
            text-decoration: none;
            margin-left: 1rem;
            padding: 0.5rem 1rem;
            border-radius: 0.25rem;
            transition: background 0.3s;
        }
        .nav a:hover { background: rgba(255,255,255,0.1); }
        .container {
            max-width: 1200px;
            margin: 2rem auto;
            padding: 0 1rem;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin: 2rem 0;
        }
        .card {
            background: white;
            padding: 1.5rem;
            border-radius: 0.5rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            transition: transform 0.3s, box-shadow 0.3s;
        }
        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 5px 20px rgba(0,0,0,0.15);
        }
        .metric {
            font-size: 2rem;
            font-weight: bold;
            color: #3498db;
        }
        .label {
            color: #7f8c8d;
            margin-top: 0.5rem;
        }
        .chart {
            height: 200px;
            background: linear-gradient(45deg, #3498db, #9b59b6);
            border-radius: 0.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.2rem;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Dashboard</h1>
        <nav class="nav">
            <a href="/">Home</a>
            <a href="/dashboard">Dashboard</a>
            <a href="/about">About</a>
        </nav>
    </div>

    <div class="container">
        <h2>Analytics Overview</h2>
        <div class="grid">
            <div class="card">
                <div class="metric" id="users">1,234</div>
                <div class="label">Active Users</div>
            </div>
            <div class="card">
                <div class="metric" id="revenue">$56,789</div>
                <div class="label">Revenue</div>
            </div>
            <div class="card">
                <div class="metric" id="orders">89</div>
                <div class="label">Orders Today</div>
            </div>
            <div class="card">
                <div class="chart">
                    📈 Performance Chart
                </div>
            </div>
        </div>
    </div>

    <script>
        console.log('📊 Dashboard loaded successfully!');

        // Simulate real-time updates
        function updateMetrics() {
            const users = document.getElementById('users');
            const revenue = document.getElementById('revenue');
            const orders = document.getElementById('orders');

            // Animate numbers
            setInterval(() => {
                users.textContent = (1234 + Math.floor(Math.random() * 100)).toLocaleString();
                revenue.textContent = '$' + (56789 + Math.floor(Math.random() * 1000)).toLocaleString();
                orders.textContent = (89 + Math.floor(Math.random() * 10)).toString();
            }, 3000);
        }

        // Add loading animation
        document.addEventListener('DOMContentLoaded', () => {
            const cards = document.querySelectorAll('.card');
            cards.forEach((card, index) => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    card.style.transition = 'all 0.6s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, index * 100);
            });

            updateMetrics();
        });
    </script>
</body>
</html>`, {
    headers: { 'Content-Type': 'text/html' }
});

const aboutApp = new Response(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>About - HTML Imports</title>
    <style>
        body {
            font-family: system-ui, sans-serif;
            line-height: 1.6;
            margin: 0;
            background: linear-gradient(120deg, #a8edea 0%, #fed6e3 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
        }
        .header {
            text-align: center;
            margin-bottom: 3rem;
        }
        .header h1 {
            font-size: 3rem;
            margin: 0;
            background: linear-gradient(45deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .nav {
            text-align: center;
            margin: 2rem 0;
        }
        .nav a {
            color: #667eea;
            text-decoration: none;
            margin: 0 1rem;
            padding: 0.5rem 1rem;
            border: 2px solid #667eea;
            border-radius: 2rem;
            transition: all 0.3s;
        }
        .nav a:hover {
            background: #667eea;
            color: white;
            transform: scale(1.05);
        }
        .content {
            background: rgba(255,255,255,0.9);
            padding: 2rem;
            border-radius: 1rem;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }
        .feature-list {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin: 2rem 0;
        }
        .feature {
            padding: 1rem;
            background: rgba(102, 126, 234, 0.1);
            border-radius: 0.5rem;
            border-left: 4px solid #667eea;
        }
        .feature h3 {
            margin-top: 0;
            color: #667eea;
        }
        code {
            background: rgba(102, 126, 234, 0.1);
            padding: 0.2rem 0.4rem;
            border-radius: 0.25rem;
            font-family: 'Monaco', 'Menlo', monospace;
        }
        .highlight {
            background: linear-gradient(120deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
            padding: 1rem;
            border-radius: 0.5rem;
            margin: 1rem 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>ℹ️ About HTML Imports</h1>
            <p>Learn how to use HTML imports with Chara CLI</p>
        </div>

        <nav class="nav">
            <a href="/">Home</a>
            <a href="/dashboard">Dashboard</a>
            <a href="/about">About</a>
        </nav>

        <div class="content">
            <h2>What are HTML Imports?</h2>
            <p>HTML imports allow you to import HTML files directly in your server code and serve them as bundled applications. This bridges the gap between static file serving and modern frontend development.</p>

            <div class="highlight">
                <h3>🚀 Quick Start</h3>
                <p>1. Import your HTML file:</p>
                <code>import myApp from "./index.html";</code>

                <p>2. Use it in your server config:</p>
                <code>directories: { "/": myApp }</code>
            </div>

            <h2>Key Features</h2>
            <div class="feature-list">
                <div class="feature">
                    <h3>🎯 Direct Imports</h3>
                    <p>Import HTML files just like any other module</p>
                </div>
                <div class="feature">
                    <h3>⚡ Auto Bundling</h3>
                    <p>Automatic processing of CSS, JS, and TypeScript</p>
                </div>
                <div class="feature">
                    <h3>🔥 Hot Reloading</h3>
                    <p>Live updates during development</p>
                </div>
                <div class="feature">
                    <h3>🎨 Framework Support</h3>
                    <p>Works with React, Vue, and vanilla JS</p>
                </div>
            </div>

            <h2>Example Usage</h2>
            <div class="highlight">
                <pre><code>import { serveStaticAction } from '@chara-codes/cli';
import homeApp from "./index.html";
import dashboardApp from "./dashboard.html";

await serveStaticAction({
  port: 3000,
  directories: {
    "/": homeApp,
    "/dashboard": dashboardApp
  },
  development: true
});</code></pre>
            </div>

            <p><strong>This example demonstrates:</strong></p>
            <ul>
                <li>Multiple HTML imports on different routes</li>
                <li>Embedded CSS and JavaScript</li>
                <li>Responsive design and animations</li>
                <li>Interactive features and console logging</li>
            </ul>
        </div>
    </div>

    <script>
        console.log('ℹ️ About page loaded successfully!');

        document.addEventListener('DOMContentLoaded', () => {
            // Add scroll animations
            const features = document.querySelectorAll('.feature');
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.transform = 'translateY(0)';
                        entry.target.style.opacity = '1';
                    }
                });
            });

            features.forEach(feature => {
                feature.style.opacity = '0';
                feature.style.transform = 'translateY(20px)';
                feature.style.transition = 'all 0.6s ease';
                observer.observe(feature);
            });
        });
    </script>
</body>
</html>`, {
    headers: { 'Content-Type': 'text/html' }
});

/**
 * Example 1: Basic HTML imports
 */
async function basicExample() {
    console.log("🌐 Starting basic HTML imports example...\n");

    try {
        const { server, port, url } = await serveStaticAction({
            port: 3000,
            directories: {
                "/": homeApp,
                "/dashboard": dashboardApp,
                "/about": aboutApp,
            },
            development: true,
            verbose: true,
        });

        console.log(`✅ Server running at: ${url}`);
        console.log("\nHTML Import Routes:");
        console.log("• http://localhost:3000/         -> Home App");
        console.log("• http://localhost:3000/dashboard -> Dashboard App");
        console.log("• http://localhost:3000/about    -> About App");

        console.log("\n📝 How this works:");
        console.log("1. HTML files are imported as Response objects");
        console.log("2. Each route serves a complete HTML application");
        console.log("3. CSS and JavaScript are embedded inline");
        console.log("4. Development mode enables hot reloading");

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
 * Example 2: Mixed HTML imports and static files
 */
async function mixedExample() {
    console.log("🚀 Starting mixed HTML imports + static files example...\n");

    try {
        const { server, port, url } = await serveStaticAction({
            port: 3001,
            directories: {
                "/": homeApp,                    // HTML import
                "/dashboard": dashboardApp,      // HTML import
                "/static": "./public",           // Static directory
                "/assets": "./dist"              // Static directory
            },
            development: true,
            verbose: true,
        });

        console.log(`✅ Mixed server running at: ${url}`);
        console.log("\nRoute Mapping:");
        console.log("• /               -> HTML import (homeApp)");
        console.log("• /dashboard      -> HTML import (dashboardApp)");
        console.log("• /static/*       -> Static files");
        console.log("• /assets/*       -> Static files");

        console.log("\n📝 Benefits:");
        console.log("• Combine dynamic HTML apps with static assets");
        console.log("• Serve images, fonts, and other files statically");
        console.log("• HTML imports get bundling and hot reloading");
        console.log("• Static files are served efficiently");

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

// Run examples based on command line argument
const example = process.argv[2] || "basic";

switch (example) {
    case "basic":
        basicExample();
        break;
    case "mixed":
        mixedExample();
        break;
    default:
        console.log("Usage: node simple-html-imports.ts [basic|mixed]");
        console.log("\nExamples:");
        console.log("• basic - Basic HTML imports demo");
        console.log("• mixed - HTML imports + static files");
        process.exit(1);
}
