import { resolve } from "node:path";
import { logger } from "@chara/logger";
import type { ServerWebSocket } from "bun";
import { initAgent } from "./agents";
import {
  beautifyController,
  chatController,
  miscController,
  modelsController,
  providersController,
  statusController,
} from "./controllers";
import { mcpWrapper } from "./mcp/mcp-client";
import { appEvents } from "./services/events";
import { runnerService } from "./services/runner";
import { tools as localTools } from "./tools/";
import { logWithPreset } from "./utils";

export { beautifyAgent } from "./agents/beautify-agent";
// Export agents for programmatic use
export { chatAgent } from "./agents/chat-agent";
export { gitAgent } from "./agents/git-agent";
export { initAgent } from "./agents/init-agent";
// Export providers for external use
export { providersRegistry } from "./providers/";
// Export tools for external use
export { tools } from "./tools/";

// Store connected WebSocket clients
const wsClients = new Set<ServerWebSocket<unknown>>();

export async function initializeCharaConfig(
  charaConfigFile = ".chara.json",
  model = "deepseek:::deepseek-chat",
) {
  if (!(await Bun.file(charaConfigFile).exists())) {
    const init = await initAgent({
      model,
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
  return await Bun.file(charaConfigFile).json();
}

export async function startServer(
  options: { charaConfigFile?: string; port?: number } = {},
) {
  const { charaConfigFile = ".chara.json", port = 3031 } = options;
  const configFile = Bun.file(charaConfigFile);
  const charaConfig = await configFile.json();

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
    if (
      eventName !== "runner:get-status" &&
      eventName !== "runner:restart" &&
      eventName !== "runner:clear-logs"
    ) {
      broadcastToClients(eventName, data);
    }
  });

  appEvents.on("runner:status", (status) => {
    logger.dumpDebug(status);
    // setInterval(() => {
    //   appEvents.emit("runner:get-status", { processId: status.processId });
    // }, 3000);
  });

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

  // biome-ignore lint/suspicious/noExplicitAny: Server config requires any type for Bun compatibility
  const serverConfig: any = {
    port,
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
    fetch(req: Request, server: any) {
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
      return miscController.fallback();
    },

    // WebSocket configuration
    websocket: {
      message(ws: any, message: any) {
        try {
          const data = JSON.parse(message.toString());
          logger.debug("WebSocket message received:", data);

          // Handle runner commands from client
          if (
            [
              "runner:get-status",
              "runner:restart",
              "runner:clear-logs",
            ].includes(data.event)
          ) {
            appEvents.emit(data.event, data.data || {});
          }
        } catch (error) {
          logger.error("Failed to parse WebSocket message:", error);
        }
      },

      open(ws: any) {
        wsClients.add(ws);
        logger.debug(
          `WebSocket client connected. Total clients: ${wsClients.size}`,
        );
      },

      close(ws: any) {
        wsClients.delete(ws);
        logger.debug(
          `WebSocket client disconnected. Total clients: ${wsClients.size}`,
        );
      },

      error(ws: any, error: any) {
        logger.error("WebSocket error:", error);
        wsClients.delete(ws);
      },
    },
  };
  logger.info("🌐 Starting HTTP server ");
  const server = Bun.serve(serverConfig);
  const protocol = serverConfig.tls ? "https" : "http";
  logger.server(`Server started on ${protocol}://localhost:${server.port}`);
  logger.debug(`🔌 WebSocket server ready at ws://localhost:${server.port}/ws`);
  logger.debug("🎉 Server fully ready to accept requests");

  return server;
}

if (import.meta.main) {
  // Check if current working directory is the parent directory and change to ../tmp if so
  const currentDir = process.cwd();
  const parentDir = resolve(__dirname, "..");
  if (currentDir === parentDir) {
    const tmpDir = resolve(parentDir, "tmp");
    process.chdir(tmpDir);
    logger.debug(`📁 Changed working directory to: ${tmpDir}`);
  }
  await initializeCharaConfig();
  // Start the dev server
  startServer().catch((error) => {
    logger.error("Failed to start server:", error);
    process.exit(1);
  });
}
