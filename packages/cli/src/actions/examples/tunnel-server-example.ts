/**
 * Example usage of tunnel server actions
 *
 * This example demonstrates how to use the tunnel server actions
 * to start and stop tunnel servers programmatically.
 */

import { ActionFactory } from "../registry";
import type { StartTunnelServerActionOptions, StopTunnelServerActionOptions } from "../types";

/**
 * Example 1: Basic tunnel server startup
 */
async function basicTunnelServerExample() {
  console.log("🚀 Starting basic tunnel server...");

  try {
    const result = await ActionFactory.execute<StartTunnelServerActionOptions>(
      "start-tunnel-server",
      {
        port: 1337,
        domain: "myapp.dev",
        controlDomain: "tunnel.myapp.dev",
        verbose: true,
      }
    );

    console.log(`✅ Tunnel server started on port ${result.port}`);
    console.log(`🌐 Domain: ${result.domain}`);
    console.log(`📡 Control Domain: ${result.controlDomain}`);

    // Stop the server after 30 seconds
    setTimeout(async () => {
      await ActionFactory.execute<StopTunnelServerActionOptions>(
        "stop-tunnel-server",
        {
          server: result.server,
          verbose: true,
        }
      );
      console.log("🛑 Tunnel server stopped");
    }, 30000);

  } catch (error) {
    console.error("❌ Failed to start tunnel server:", error);
  }
}

/**
 * Example 2: Tunnel server with content replacements
 */
async function tunnelServerWithReplacementsExample() {
  console.log("🔧 Starting tunnel server with content replacements...");

  try {
    const result = await ActionFactory.execute<StartTunnelServerActionOptions>(
      "start-tunnel-server",
      {
        port: 1338,
        domain: "dev.example.com",
        controlDomain: "control.dev.example.com",
        replacements: [
          {
            pattern: "</body>",
            replacement: `
              <script>
                console.log('🔧 Development mode active');
                // Add development tools
                window.__DEV__ = true;
              </script>
              </body>
            `,
          },
          {
            pattern: /<title>(.*?)<\/title>/,
            replacement: "<title>$1 [DEV]</title>",
          },
          {
            pattern: "</head>",
            replacement: `
              <style>
                /* Development indicator */
                body::before {
                  content: "DEV MODE";
                  position: fixed;
                  top: 0;
                  right: 0;
                  background: #ff6b6b;
                  color: white;
                  padding: 5px 10px;
                  font-size: 12px;
                  z-index: 9999;
                }
              </style>
              </head>
            `,
          },
        ],
        verbose: true,
      }
    );

    console.log("✅ Tunnel server with replacements started");
    console.log(`📝 Active replacements: ${result.replacements?.length || 0}`);

    return result.server;
  } catch (error) {
    console.error("❌ Failed to start tunnel server with replacements:", error);
    throw error;
  }
}

/**
 * Example 3: Tunnel server with config file
 */
async function tunnelServerWithConfigFileExample() {
  console.log("📁 Starting tunnel server with config file...");

  try {
    const result = await ActionFactory.execute<StartTunnelServerActionOptions>(
      "start-tunnel-server",
      {
        port: 1339,
        domain: "localhost.dev",
        controlDomain: "tunnel.localhost.dev",
        configFile: "./tunnel-config.json", // Config file with replacements
        verbose: true,
      }
    );

    console.log("✅ Tunnel server with config file started");
    return result.server;
  } catch (error) {
    console.error("❌ Failed to start tunnel server with config file:", error);
    throw error;
  }
}

/**
 * Example 4: Multiple tunnel servers for different environments
 */
async function multipleTunnelServersExample() {
  console.log("🔀 Starting multiple tunnel servers...");

  const servers = [];

  try {
    // Development server
    const devServer = await ActionFactory.execute<StartTunnelServerActionOptions>(
      "start-tunnel-server",
      {
        port: 1340,
        domain: "dev.myproject.com",
        controlDomain: "dev-tunnel.myproject.com",
        replacements: [
          {
            pattern: "</head>",
            replacement: '<meta name="environment" content="development"></head>',
          },
        ],
        silent: true,
      }
    );
    servers.push(devServer.server);
    console.log("✅ Development tunnel server started on port 1340");

    // Staging server
    const stagingServer = await ActionFactory.execute<StartTunnelServerActionOptions>(
      "start-tunnel-server",
      {
        port: 1341,
        domain: "staging.myproject.com",
        controlDomain: "staging-tunnel.myproject.com",
        replacements: [
          {
            pattern: "</head>",
            replacement: '<meta name="environment" content="staging"></head>',
          },
        ],
        silent: true,
      }
    );
    servers.push(stagingServer.server);
    console.log("✅ Staging tunnel server started on port 1341");

    // Return cleanup function
    return async () => {
      console.log("🧹 Cleaning up all tunnel servers...");
      for (const server of servers) {
        await ActionFactory.execute<StopTunnelServerActionOptions>(
          "stop-tunnel-server",
          {
            server,
            silent: true,
          }
        );
      }
      console.log("✅ All tunnel servers stopped");
    };

  } catch (error) {
    console.error("❌ Failed to start multiple tunnel servers:", error);

    // Cleanup on error
    for (const server of servers) {
      try {
        await ActionFactory.execute<StopTunnelServerActionOptions>(
          "stop-tunnel-server",
          {
            server,
            silent: true,
            force: true,
          }
        );
      } catch (cleanupError) {
        console.error("❌ Failed to cleanup server:", cleanupError);
      }
    }
    throw error;
  }
}

/**
 * Example 5: Graceful shutdown handling
 */
async function gracefulShutdownExample() {
  console.log("🔄 Starting tunnel server with graceful shutdown...");

  let server: any = null;

  // Handle process termination
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n📡 Received ${signal}, shutting down gracefully...`);

    if (server) {
      try {
        await ActionFactory.execute<StopTunnelServerActionOptions>(
          "stop-tunnel-server",
          {
            server,
            force: false, // Graceful shutdown
            verbose: true,
          }
        );
        console.log("✅ Tunnel server stopped gracefully");
      } catch (error) {
        console.error("❌ Error during graceful shutdown:", error);
        // Force stop if graceful shutdown fails
        await ActionFactory.execute<StopTunnelServerActionOptions>(
          "stop-tunnel-server",
          {
            server,
            force: true,
            silent: true,
          }
        );
      }
    }

    process.exit(0);
  };

  // Register signal handlers
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

  try {
    const result = await ActionFactory.execute<StartTunnelServerActionOptions>(
      "start-tunnel-server",
      {
        port: 1342,
        domain: "graceful.dev",
        controlDomain: "tunnel.graceful.dev",
        verbose: true,
      }
    );

    server = result.server;
    console.log("✅ Tunnel server started with graceful shutdown handling");
    console.log("🔄 Press Ctrl+C to trigger graceful shutdown");

    // Keep the process running
    return new Promise((resolve) => {
      // This will run until the process is terminated
    });

  } catch (error) {
    console.error("❌ Failed to start tunnel server:", error);
    throw error;
  }
}

/**
 * Example config file content for tunnel-config.json
 */
const exampleConfigFileContent = {
  replacements: [
    {
      pattern: "</body>",
      replacement: `
        <script>
          // Development tools injection
          console.log('🔧 Tunnel development mode active');

          // Add hot reload indicator
          const indicator = document.createElement('div');
          indicator.style.cssText = \`
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: #4CAF50;
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
            z-index: 10000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          \`;
          indicator.textContent = '🔄 Tunnel Active';
          document.body.appendChild(indicator);
        </script>
        </body>
      `,
    },
    {
      pattern: /<title>(.*?)<\/title>/,
      replacement: "<title>🔧 $1 [Tunnel Dev]</title>",
    },
    {
      pattern: "</head>",
      replacement: `
        <style>
          /* Development styling */
          html {
            border-top: 3px solid #ff6b6b;
          }
        </style>
        <meta name="tunnel-mode" content="development">
        </head>
      `,
    },
  ],
};

// Export examples for use
export {
  basicTunnelServerExample,
  tunnelServerWithReplacementsExample,
  tunnelServerWithConfigFileExample,
  multipleTunnelServersExample,
  gracefulShutdownExample,
  exampleConfigFileContent,
};

// Run example if this file is executed directly
if (import.meta.main) {
  console.log("🚀 Running tunnel server examples...\n");

  // Run the basic example
  basicTunnelServerExample().catch((error) => {
    console.error("❌ Example failed:", error);
    process.exit(1);
  });
}
