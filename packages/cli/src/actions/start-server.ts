import { logger } from "@apk/logger";
import { intro, spinner } from "../utils/prompts";
import { bold, cyan } from "picocolors";
import { existsGlobalConfig, readGlobalConfig } from "@apk/settings";
import { startServer } from "@apk/server";
import type { StartServerActionOptions } from "./types";

/**
 * Start the Chara server with configurable options
 *
 * @param options Configuration options for the server
 * @param options.port Port to start server on (default: 3030)
 * @param options.mcpEnabled Enable Model Context Protocol support
 * @param options.websocketEnabled Enable WebSocket support
 * @param options.silent Suppress UI output for programmatic use
 * @param options.verbose Enable detailed logging
 *
 * @returns Promise resolving to server manager and port
 *
 * @example
 * ```typescript
 * // Start server with custom configuration
 * const { server, port } = await startServerAction({
 *   port: 3030,
 *   mcpEnabled: true,
 *   websocketEnabled: true,
 *   verbose: true
 * });
 * ```
 */
export async function startServerAction(
  options: StartServerActionOptions = {},
): Promise<{ server: any; port: number }> {
  if (options.verbose) {
    logger.setLevel("debug");
  }

  if (!options.silent) {
    intro(bold(cyan("🚀 Starting Chara Server")));
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

  let serverResult: any;
  try {
    const port = options.port || 3030;
    logger.debug("Starting server on port:", port);

    // Log enabled features
    const enabledFeatures = [];
    if (options.mcpEnabled) enabledFeatures.push("MCP");
    if (options.websocketEnabled) enabledFeatures.push("WebSocket");

    if (enabledFeatures.length > 0 && options.verbose) {
      logger.debug(`Enabled features: ${enabledFeatures.join(", ")}`);
    }

    serverResult = await startServer({
      port,
      host: options.host || "localhost",
      mcp: {
        enabled: options.mcpEnabled ?? false,
        transport: options.mcpTransport || "stdio",
      },
      websocket: {
        enabled: options.websocketEnabled ?? false,
        path: options.websocketPath || "/ws",
      },
      cors: {
        enabled: options.corsEnabled ?? true,
        origin: options.corsOrigin || "*",
      },
      logging: {
        enabled: options.loggingEnabled ?? true,
        level: options.verbose ? "debug" : "info",
      },
    });

    if (!options.silent) {
      const statusMessage =
        enabledFeatures.length > 0
          ? `Server started on port ${port} with ${enabledFeatures.join(", ")}`
          : `Server started on port ${port}`;
      s.stop(statusMessage);
    }

    logger.debug(`Server successfully started on port ${port}`);
    return { server: serverResult.manager, port };
  } catch (error) {
    if (!options.silent) {
      s.stop("Failed to start server");
    }
    logger.error("Error starting server:", error);
    throw error;
  }
}
