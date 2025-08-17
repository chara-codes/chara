import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { NodeFS } from "@chara-codes/shared";
import { Project } from "@netlify/build-info";
import type { ServerWebSocket } from "bun";
import {
  beautifyController,
  chatController,
  gitController,
  miscController,
  modelsController,
  providersController,
  statusController,
  suggestController,
} from "./controllers";
import { closeMcpClients, initializeMcpTools } from "./mcp/mcp-servers";
import { initialize } from "./providers/";
import { chatService } from "./services/chat";
import { appEvents } from "./services/events";
import { runnerService } from "./services/runner";
import { logger, LogLevel } from "./utils/logger";

const DEFAULT_DEV_COMMAND = "npx live-server --no-browser {path}";

/**
 * Detects the development command for the current project using @netlify/build-info
 * @param cwd Working directory to analyze (defaults to process.cwd())
 * @returns The detected dev command or fallback default
 */
async function detectDevCommand(cwd: string = process.cwd()): Promise<string> {
  const defaultCommand = DEFAULT_DEV_COMMAND.replace("{path}", cwd);

  try {
    const fsImpl = new NodeFS();
    const project = new Project(fsImpl, cwd)
      .setEnvironment(process.env)
      .setNodeVersion(process.version);

    const buildSettings = await project.getBuildSettings();

    if (buildSettings.length > 0 && buildSettings[0]?.devCommand) {
      const detectedCommand = buildSettings[0].devCommand;
      logger.debug(`Detected dev command: ${detectedCommand}`);
      return detectedCommand;
    }
  } catch (error) {
    logger.debug("Failed to detect dev command, using fallback:", error);
  }

  return defaultCommand;
}

export { beautifyAgent } from "./agents/beautify-agent";
// Export agents for programmatic use
export {
  chatAgent,
  cleanMessages,
  type ChatAgentCallbacks,
} from "./agents/chat-agent";
export { gitAgent } from "./agents/git-agent";
export {
  suggestionAgent,
  parseSuggestionsFromResponse,
} from "./agents/suggestion-agent";
// Export providers for external use
export { initialize, providersRegistry } from "./providers/";
// Export git service for external use
export { isoGitService } from "./services/isogit";
// Export tools for external use
export { tools } from "./tools/";
// Export shared utilities for external use
export { NodeFS } from "@chara-codes/shared";
// Export dev command detection utility
export { detectDevCommand };

// Store connected WebSocket clients
const wsClients = new Set<ServerWebSocket<unknown>>();

// Store active runner process ID
let activeRunnerProcessId: string | null = null;

export async function initializeCharaEnvironment() {
  await initialize();

  // Detect dev command using utility function
  const devCommand = await detectDevCommand();
  logger.log("Dev server:", devCommand);
  return { devCommand };
}

export interface StartServerOptions {
  /** Path to the MCP configuration file */
  mcpConfigFile?: string;
  /** Port number for the HTTP server */
  port?: number;
  /** Log level for the server */
  logLevel?: LogLevel;
  /** WebSocket configuration */
  websocket?: {
    /** Whether to enable WebSocket server */
    enabled?: boolean;
    /** WebSocket endpoint path */
    endpoint?: string;
  };
  /** Runner service configuration */
  runner?: {
    /** Whether to enable runner service */
    enabled?: boolean;
    /** Command to run (overrides auto-detected command) */
    command?: string;
    /** Working directory for the command */
    cwd?: string;
  };
}

export interface ServerInstance {
  /** The underlying Bun server */
  server: ReturnType<typeof Bun.serve>;
  /** Event emitter for server events */
  events: typeof appEvents;
  /** Stop the server and cleanup resources */
  stop: () => Promise<void>;
  /** Restart specific services */
  restart: (services?: ("mcp" | "runner")[]) => Promise<void>;
  /** Active runner process */
  activeRunnerProcessId: string | null;
}

/**
 * Validates server options and throws if invalid
 */
function validateServerOptions(options: StartServerOptions): void {
  if (
    options.port !== undefined &&
    (options.port < 1 || options.port > 65535)
  ) {
    throw new Error("Port must be between 1 and 65535");
  }

  if (
    options.websocket?.endpoint &&
    !options.websocket.endpoint.startsWith("/")
  ) {
    throw new Error("WebSocket endpoint must start with '/'");
  }

  if (options.runner?.cwd && !existsSync(options.runner.cwd)) {
    throw new Error(
      `Runner working directory does not exist: ${options.runner.cwd}`
    );
  }
}

/**
 * Helper function to create server configuration
 */
function createServerConfig(config: {
  port: number;
  websocket: { enabled: boolean; endpoint: string };
  runner: { enabled: boolean };
}) {
  // biome-ignore lint/suspicious/noExplicitAny: Server config requires any type for Bun compatibility
  const serverConfig: any = {
    port: config.port,
    idleTimeout: 255,
    routes: {
      // Static routes
      "/api/suggest": suggestController,
      "/api/status": statusController.getStatus,
      "/api/models": modelsController.getModels,
      "/api/providers": providersController.list,
      "/api/beautify": beautifyController,
      "/api/git/reset": gitController,
      "/api/chat": chatController,

      // Wildcard route for all routes that start with "/api/" and aren't otherwise matched
      "/api/*": miscController.notFound,
    },

    // WebSocket upgrade handler
    fetch(req: Request, server: any) {
      const url = new URL(req.url);

      // Handle WebSocket upgrade if enabled
      if (
        config.websocket.enabled &&
        url.pathname === config.websocket.endpoint
      ) {
        const success = server.upgrade(req);
        if (success) {
          return undefined; // Bun automatically returns 101 Switching Protocols
        }
        return new Response("WebSocket upgrade failed", { status: 400 });
      }

      // Handle other routes normally
      return miscController.fallback();
    },
  };

  // Add WebSocket configuration if enabled
  if (config.websocket.enabled) {
    serverConfig.websocket = {
      message(ws: any, message: any) {
        try {
          const data = JSON.parse(message.toString());
          logger.debug("WebSocket message received:", data);

          // Handle chat events
          if (data.event && data.event.startsWith("chat:")) {
            chatService.handleEvent(data.event, data.data, ws);
          }
          // Handle runner commands from client (only if runner is enabled)
          else if (
            config.runner.enabled &&
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
          `WebSocket client connected. Total clients: ${wsClients.size}`
        );
      },

      close(ws: any) {
        wsClients.delete(ws);
        // Clean up any chat subscriptions associated with this WebSocket
        chatService.cleanupClientSubscriptions(ws);
        logger.debug(
          `WebSocket client disconnected. Total clients: ${wsClients.size}`
        );
      },

      error(ws: any, error: any) {
        logger.error("WebSocket error:", error);
        wsClients.delete(ws);
      },
    };
  }

  return serverConfig;
}

/**
 * Starts the Chara server with configurable options
 * @param options Configuration options for the server
 * @returns Promise that resolves to a ServerInstance with control methods
 */
export async function startServer(
  options: StartServerOptions = {}
): Promise<ServerInstance> {
  // initialize providers
  await initialize();

  // Validate options
  validateServerOptions(options);

  const {
    mcpConfigFile = ".mcp.json",
    port = 3031,
    logLevel = LogLevel.INFO,
    websocket = { enabled: true, endpoint: "/ws" },
    runner = { enabled: true },
  } = options;

  logger.setLevel(logLevel);

  // Read MCP configuration
  let mcpConfig: { mcpServers?: any } = {};
  try {
    const mcpFile = Bun.file(mcpConfigFile); // await fs.readFile(mcpConfigFile, "utf-8");
    mcpConfig = await mcpFile.json();
  } catch (error) {
    logger.debug(`No MCP config found at ${mcpConfigFile}, using empty config`);
  }

  // Detect development command using utility function
  const autoDetectedDevCommand = await detectDevCommand(
    runner.cwd || process.cwd()
  );

  // Set up WebSocket broadcasting for runner events (only if WebSocket is enabled)
  let broadcastToClients: ((eventName: string, data: any) => void) | undefined;

  if (websocket.enabled) {
    broadcastToClients = (eventName: string, data: any) => {
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
        broadcastToClients?.(eventName, data);
      }
    });
  }

  // Initialize runner service if enabled
  if (runner.enabled) {
    appEvents.on("runner:status", (status) => {
      logger.dumpDebug(status);
    });

    try {
      activeRunnerProcessId = await runnerService.start({
        command: runner.command || autoDetectedDevCommand,
        cwd: runner.cwd || process.cwd(),
      });
    } catch (error: any) {
      logger.error("Failed to start runner service:", error);
    }
  }

  // --- MCP Initialization ---
  // Initialize controllers and services with empty tools first
  chatService.setTools({});
  suggestController.setTools({});
  chatController.setTools({});

  // Asynchronously initialize MCP tools and update controllers when done
  const initializeMcpInBackground = async () => {
    if (mcpConfig.mcpServers && Object.keys(mcpConfig.mcpServers).length > 0) {
      logger.info("🚀 Initializing MCP tools in background...");
      const mcpTools = await initializeMcpTools(mcpConfig.mcpServers);
      const mcpCount = Object.keys(mcpTools).length;
      logger.debug(
        `✅ MCP background initialization complete! Loaded ${mcpCount} tools.`
      );
      chatService.setTools(mcpTools);
      suggestController.setTools(mcpTools);
      chatController.setTools(mcpTools);
    } else {
      logger.debug(
        "📦 No MCP servers configured in .mcp.json, skipping MCP initialization."
      );
    }
  };

  // Start initialization without awaiting it
  initializeMcpInBackground();

  // Create server configuration
  const serverConfig = createServerConfig({
    port,
    websocket: {
      enabled: websocket.enabled ?? true,
      endpoint: websocket.endpoint ?? "/ws",
    },
    runner: {
      enabled: runner.enabled ?? true,
    },
  });

  logger.debug("🌐 Starting HTTP server ");
  const server = Bun.serve(serverConfig);
  const protocol = serverConfig.tls ? "https" : "http";
  logger.debug(`Server started on ${protocol}://localhost:${server.port}`);

  if (websocket.enabled) {
    logger.debug(
      `🔌 WebSocket server ready at ws://localhost:${server.port}${websocket.endpoint}`
    );
  }

  if (runner.enabled) {
    logger.debug("🏃 Runner service initialized");
  }

  if (mcpConfig.mcpServers && Object.keys(mcpConfig.mcpServers).length > 0) {
    logger.debug(`🔧 MCP service initializing in background...`);
  }

  logger.info("📋 Server configuration:");
  logger.info(`   Port: ${server.port}`);
  logger.info(
    `   MCP: ${
      mcpConfig.mcpServers && Object.keys(mcpConfig.mcpServers).length > 0
        ? "enabled"
        : "disabled"
    }`
  );
  logger.info(`   WebSocket: ${websocket.enabled ? "enabled" : "disabled"}`);
  logger.info(`   Runner: ${runner.enabled ? "enabled" : "disabled"}`);
  logger.info(`   Dev Command: ${runner.command || autoDetectedDevCommand}`);

  logger.debug("🎉 Server fully ready to accept requests");

  // Create server instance with control methods
  const serverInstance: ServerInstance = {
    server,
    events: appEvents,
    activeRunnerProcessId,
    async stop() {
      logger.debug("🛑 Stopping server...");

      // Stop runner service if enabled
      if (runner.enabled) {
        logger.debug("🛑 Stopping runner service...");
        if (activeRunnerProcessId) {
          await runnerService.stop(activeRunnerProcessId);
        } else {
          await runnerService.stopAll();
        }
      }

      // Close WebSocket connections
      if (websocket.enabled) {
        logger.debug("🛑 Closing WebSocket connections...");
        for (const client of wsClients) {
          client.close();
        }
        wsClients.clear();
      }

      // Stop MCP if enabled
      if (
        mcpConfig.mcpServers &&
        Object.keys(mcpConfig.mcpServers).length > 0
      ) {
        logger.debug("🛑 Stopping MCP services...");
        await closeMcpClients();
      }

      // Stop WebSocket chat service
      chatService.destroy();

      // Stop the server
      server.stop(true);
      logger.debug("✅ Server stopped successfully");
    },

    async restart(services = ["mcp", "runner"]) {
      logger.debug("🔄 Restarting services:", services);

      if (services.includes("runner") && runner.enabled) {
        logger.debug("🔄 Restarting runner service...");
        if (activeRunnerProcessId) {
          await runnerService.stop(activeRunnerProcessId);
        } else {
          await runnerService.stopAll();
        }
        try {
          activeRunnerProcessId = await runnerService.start({
            command: runner.command || autoDetectedDevCommand,
            cwd: runner.cwd || process.cwd(),
          });
        } catch (error: any) {
          logger.error("Failed to restart runner service:", error);
        }
      }

      if (
        services.includes("mcp") &&
        mcpConfig.mcpServers &&
        Object.keys(mcpConfig.mcpServers).length > 0
      ) {
        logger.debug("🔄 Restarting MCP service...");
        // Don't await this so it doesn't block
        initializeMcpInBackground();
      }

      logger.debug("✅ Service restart complete");
    },
  };

  return serverInstance;
}

if (import.meta.main) {
  const workDir = resolve(__dirname, "..", "tmp");
  logger.log(workDir);
  process.chdir(workDir);
  logger.log(process.cwd());
  await initializeCharaEnvironment();

  // Start the dev server
  let serverInstance: ServerInstance;

  try {
    serverInstance = await startServer({});

    // Handle graceful shutdown
    process.on("SIGINT", async () => {
      logger.info("🛑 Received SIGINT, shutting down gracefully...");
      await serverInstance.stop();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      logger.info("🛑 Received SIGTERM, shutting down gracefully...");
      await serverInstance.stop();
      process.exit(0);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}
