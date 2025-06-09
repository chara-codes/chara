import { logger } from "@chara/logger";
import { mcpWrapper } from "./mcp/mcp-client";
import {
  statusController,
  miscController,
  beautifyController,
  modelsController,
  providersController,
  chatController,
} from "./controllers";

async function startServer() {
  // Initialize MCP before starting server
  logger.info("🚀 Starting server initialization...");
  logger.info("🔧 Initializing MCP client...");

  await mcpWrapper.initialize();

  // Verify tools are ready
  const tools = mcpWrapper.getTools();
  logger.info(
    `✅ MCP initialization complete. Available tools: ${Object.keys(tools).length}`,
  );

  if (Object.keys(tools).length === 2) {
    logger.warning("⚠️ Only 2 tools found - using fallback tools!");
  } else {
    logger.info(
      "🎯 MCP tools loaded successfully:",
      Object.keys(tools).slice(0, 3),
    );
  }

  // Check for HTTPS configuration
  const certPath = process.env.CERT_PATH;
  const keyPath = process.env.KEY_PATH;

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

    // (optional) fallback for unmatched routes:
    // Required if Bun's version < 1.2.3
    fetch: miscController.fallback,
  };

  // Add HTTPS configuration if certificates are available
  if (certPath && keyPath) {
    try {
      serverConfig.tls = {
        cert: Bun.file(certPath),
        key: Bun.file(keyPath),
      };
      logger.info("🔒 HTTPS configuration loaded successfully");
    } catch (error) {
      logger.error("❌ Failed to load SSL certificates:", error);
      logger.warning("⚠️ Falling back to HTTP server");
    }
  } else {
    logger.info("🌐 Starting HTTP server (no SSL certificates provided)");
  }

  const server = Bun.serve(serverConfig);
  const protocol = serverConfig.tls ? "https" : "http";
  logger.server(`Server started on ${protocol}://localhost:${server.port}`);
  logger.info("🎉 Server fully ready to accept requests");
}

// Start the server
startServer().catch((error) => {
  logger.error("Failed to start server:", error);
  process.exit(1);
});
