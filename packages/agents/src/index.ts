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
    `✅ MCP initialization complete. Available tools: ${Object.keys(tools).length}`
  );

  if (Object.keys(tools).length === 2) {
    logger.warning("⚠️ Only 2 tools found - using fallback tools!");
  } else {
    logger.info(
      "🎯 MCP tools loaded successfully:",
      Object.keys(tools).slice(0, 3)
    );
  }

  const server = Bun.serve({
    port: 3031,
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
  });
  logger.server(`Server started on port ${server.port}`);
  logger.info("🎉 Server fully ready to accept requests");
}

// Start the server
startServer().catch((error) => {
  logger.error("Failed to start server:", error);
  process.exit(1);
});
