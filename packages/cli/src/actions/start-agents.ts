import { logger } from "@chara-codes/logger";
import { intro, spinner } from "../utils/prompts";
import { bold, cyan } from "picocolors";
import { existsGlobalConfig, readGlobalConfig } from "@chara-codes/settings";
import type { StartAgentsActionOptions } from "./types";
import { startServer, type ServerInstance } from "@chara-codes/agents";

/**
 * Helper function to safely stop the server
 */
function stopServer(server: ServerInstance | null | undefined): void {
  if (server?.stop && typeof server.stop === "function") {
    try {
      server.stop();
    } catch (closeError) {
      logger.debug("Error stopping server:", closeError);
    }
  }
}

/**
 * Start the Chara agents server with configurable features
 *
 * @param options Configuration options for the server
 * @param options.port Port to start server on (default: 3031)
 * @param options.mcp Enable Model Context Protocol support for tool usage
 * @param options.runner Enable code execution and process management capabilities
 * @param options.websocket Enable real-time WebSocket communication
 * @param options.silent Suppress UI output for programmatic use
 * @param options.verbose Enable detailed logging
 *
 * @returns Promise resolving to server instance and port
 *
 * @example
 * ```typescript
 * // Start server with all features enabled
 * const { server, port } = await startAgentsAction({
 *   port: 3031,
 *   mcp: true,
 *   runner: true,
 *   websocket: true,
 *   verbose: true
 * });
 * ```
 */
export async function startAgentsAction(
  options: StartAgentsActionOptions = {},
): Promise<{ server: ServerInstance; port: number }> {
  if (options.verbose) {
    logger.setLevel("debug");
  }

  if (!options.silent) {
    intro(bold(cyan("🚀 Starting Chara Agents Server")));
  }

  // Check if config exists
  const configExists = await existsGlobalConfig();
  if (!configExists) {
    const errorMessage =
      "No configuration found. Run 'chara init' first to set up your providers.";
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }

  try {
    await readGlobalConfig();
  } catch (error) {
    logger.error("Error reading configuration:", error);
    throw error;
  }

  // Start server
  const s = spinner();
  if (!options.silent) {
    s.start("Starting server...");
  }

  let server: ServerInstance;
  try {
    const port = options.port || 3031;
    logger.debug("Starting server on port:", port);

    // Log enabled features
    const enabledFeatures = [];
    if (options.mcp) enabledFeatures.push("MCP");
    if (options.runner) enabledFeatures.push("Runner");
    if (options.websocket) enabledFeatures.push("WebSocket");

    if (enabledFeatures.length > 0) {
      logger.debug(`Enabled features: ${enabledFeatures.join(", ")}`);
    }

    server = await startServer({
      port,
      runner: { enabled: options.runner ?? false },
      websocket: { enabled: options.websocket ?? false },
    });

    if (!options.silent) {
      const statusMessage =
        enabledFeatures.length > 0
          ? `Server started on port ${port} with ${enabledFeatures.join(", ")}`
          : `Server started on port ${port}`;
      s.stop(statusMessage);
    }

    logger.debug(`Server successfully started on port ${port}`);
    return { server, port };
  } catch (error) {
    if (!options.silent) {
      s.stop("Failed to start server");
    }
    logger.error("Error starting server:", error);
    throw error;
  }
}

/**
 * Stop the Chara agents server and cleanup resources
 *
 * @param options Configuration options including server instance
 * @param options.server Server instance to stop (can be null/undefined)
 * @param options.silent Suppress UI output for programmatic use
 * @param options.verbose Enable detailed logging
 *
 * @example
 * ```typescript
 * await stopAgentsAction({ server, silent: false });
 * ```
 */
export async function stopAgentsAction(
  options: { server?: any; silent?: boolean; verbose?: boolean } = {},
): Promise<void> {
  if (options.verbose) {
    logger.setLevel("debug");
  }

  if (!options.silent) {
    const s = spinner();
    s.start("Stopping server...");

    try {
      stopServer(options.server);
      s.stop("Server stopped successfully");
    } catch (error) {
      s.stop("Error stopping server");
      logger.error("Error stopping server:", error);
    }
  } else {
    stopServer(options.server);
  }
}
