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
import { mkdir } from "node:fs/promises";
import { logWithPreset } from "./utils";
import { runnerService } from "./services/runner";
import { appEvents } from "./services/events";

// Export agents for programmatic use
export { chatAgent } from "./agents/chat-agent";
export { initAgent } from "./agents/init-agent";
export { beautifyAgent } from "./agents/beautify-agent";
export { gitAgent } from "./agents/git-agent";

// Export tools for external use
export { tools } from "./tools/";

// Export providers for external use
export { providersRegistry } from "./providers/";

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

  appEvents.on("runner:status", (status) => {
    logger.dump(status);
  });

  runnerService.start({ command: charaConfig.dev || "npx serve ." });

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
  mkdir("tmp");
  const tmpDir = resolve(parentDir, "tmp");
  process.chdir(tmpDir);
  logger.debug(`📁 Changed working directory to: ${tmpDir}`);
}

// Start the server
startServer().catch((error) => {
  logger.error("Failed to start server:", error);
  process.exit(1);
});
