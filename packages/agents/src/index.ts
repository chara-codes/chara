import { logger } from "@chara/logger";
import { mcpWrapper } from "./mcp/mcp-client";
import { localTools } from "./tools/local-tools";
import {
  statusController,
  miscController,
  beautifyController,
  modelsController,
  providersController,
  chatController,
} from "./controllers";
import { resolve } from "node:path";
import { initAgent } from "./agents";
import { logWithPreset } from "./utils";
import { runnerService } from "./services/runner";
import { appEvents } from "./services/events";
import type { ServerWebSocket } from "bun";

// Export agents for programmatic use
export { chatAgent } from "./agents/chat-agent";
export { initAgent } from "./agents/init-agent";
export { beautifyAgent } from "./agents/beautify-agent";
export { gitAgent } from "./agents/git-agent";

// Export tools for external use
export { tools } from "./tools/";

// Export providers for external use
export { providersRegistry } from "./providers/";

// Store connected WebSocket clients
const wsClients = new Set<ServerWebSocket<unknown>>();

async function startServer(charaConfigFile = ".chara.json") {
  if (!(await Bun.file(charaConfigFile).exists())) {
    const init = initAgent({
      model: "openai:::gpt-4.1-mini",
    });
    logger.info("🛠️  Initializing Chara configuration...");
    for await (const chunk of init.fullStream) {
      logWithPreset(chunk, "minimal");
    }
  }
  if (!(await Bun.file(charaConfigFile).exists())) {
    const fallbackConfig = { dev: "npx serve ." };
    Bun.write(charaConfigFile, JSON.stringify(fallbackConfig));
  }
  const charaConfig = await Bun.file(charaConfigFile).json();

  // Set up WebSocket broadcasting for runner events
  const broadcastToClients = (eventName: string, data: any) => {
    const message = JSON.stringify({ event: eventName, data });
    for (const client of wsClients) {
      if (client.readyState === 1) {
        // WebSocket.OPEN
        client.send(message);
      }
    }
  };

  // Subscribe to runner events using pattern matching
  appEvents.onPattern("runner:*", (eventName: string, data: any) => {
    if (eventName !== "runner:get-status" && eventName !== "runner:restart") {
      broadcastToClients(eventName, data);
    }
  });

  appEvents.on("runner:status", (status) => {
    logger.dump(status);
    // setInterval(() => {
    //   appEvents.emit("runner:get-status", { processId: status.processId });
    // }, 3000);
  });

  logger.dump(process.cwd());
  runnerService.start({
    command: charaConfig.dev || "npx serve .",
    cwd: process.cwd(),
  });

  // Start MCP initialization in the background (don't wait)
  logger.info("🚀 Starting server initialization...");
  logger.info("🔧 Starting MCP client initialization in background...");

  // Initialize MCP in background - don't await it
  mcpWrapper.initializeInBackground();

  // Show initial tool status
  const localCount = Object.keys(localTools).length;
  logger.info(
    `📦 Starting with ${localCount} local tools (MCP loading in background)`,
  );

  // Log when MCP is fully ready (don't wait for it)
  mcpWrapper
    .initialize()
    .then(() => {
      const mcpTools = mcpWrapper.getToolsSync();
      const mcpCount = Object.keys(mcpTools).length;
      logger.info(
        `✅ MCP initialization complete! Now using ${localCount} local + ${mcpCount} MCP tools = ${localCount + mcpCount} total`,
      );
    })
    .catch((error) => {
      logger.warning(
        "⚠️ MCP initialization failed, continuing with local tools only:",
        error.message,
      );
    });

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const serverConfig: any = {
    port: 3031,
    idleTimeout: 255,
    routes: {
      // Static routes
      "/api/chat": chatController,
      "/api/status": statusController.getStatus,
      "/api/models": modelsController.getModels,
      "/api/providers": providersController.list,
      "/api/beautify": beautifyController,

      // Wildcard route for all routes that start with "/api/" and aren't otherwise matched
      "/api/*": miscController.notFound,
    },

    // WebSocket upgrade handler
    fetch(req, server) {
      const url = new URL(req.url);

      // Handle WebSocket upgrade for /ws endpoint
      if (url.pathname === "/ws") {
        const success = server.upgrade(req);
        if (success) {
          return undefined; // Bun automatically returns 101 Switching Protocols
        }
        return new Response("WebSocket upgrade failed", { status: 400 });
      }

      // Handle other routes normally
      return miscController.fallback(req, server);
    },

    // WebSocket configuration
    websocket: {
      message(ws, message) {
        try {
          const data = JSON.parse(message.toString());
          logger.debug("WebSocket message received:", data);

          // Handle runner commands from client
          if (data.event === "runner:get-status") {
            appEvents.emit("runner:get-status", data.data || {});
          } else if (data.event === "runner:restart") {
            appEvents.emit("runner:restart", data.data || {});
          }
        } catch (error) {
          logger.error("Failed to parse WebSocket message:", error);
        }
      },

      open(ws) {
        wsClients.add(ws);
        logger.info(
          `WebSocket client connected. Total clients: ${wsClients.size}`,
        );
      },

      close(ws) {
        wsClients.delete(ws);
        logger.info(
          `WebSocket client disconnected. Total clients: ${wsClients.size}`,
        );
      },

      error(ws, error) {
        logger.error("WebSocket error:", error);
        wsClients.delete(ws);
      },
    },
  };
  logger.info("🌐 Starting HTTP server ");
  const server = Bun.serve(serverConfig);
  const protocol = serverConfig.tls ? "https" : "http";
  logger.server(`Server started on ${protocol}://localhost:${server.port}`);
  logger.info(`🔌 WebSocket server ready at ws://localhost:${server.port}/ws`);
  logger.info("🎉 Server fully ready to accept requests");
}
// Check if current working directory is the parent directory and change to ../tmp if so
const currentDir = process.cwd();
const parentDir = resolve(__dirname, "..");
if (currentDir === parentDir) {
  const tmpDir = resolve(parentDir, "tmp");
  process.chdir(tmpDir);
  logger.debug(`📁 Changed working directory to: ${tmpDir}`);
}

// Start the server
startServer().catch((error) => {
  logger.error("Failed to start server:", error);
  process.exit(1);
});
