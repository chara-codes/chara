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
import { resolve } from "node:path";

// Export agents for programmatic use
export { chatAgent } from "./agents/chat-agent.js";
export { initAgent } from "./agents/init-agent.js";
export { beautifyAgent } from "./agents/beautify-agent.js";
export { gitAgent } from "./agents/git-agent.js";

// Export tools for external use
export { tools } from "./tools/index.js";

// Export providers for external use
export { providersRegistry } from "./providers/index.js";

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
  logger.info("🌐 Starting HTTP server ");
  const server = Bun.serve(serverConfig);
  const protocol = serverConfig.tls ? "https" : "http";
  logger.server(`Server started on ${protocol}://localhost:${server.port}`);
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
