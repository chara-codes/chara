import { logger } from "@chara-codes/logger";
import { spinner } from "../utils/prompts";
import type { StopServerActionOptions } from "./types";

/**
 * Helper function to safely stop the server
 */
function stopServer(server: any | null | undefined): void {
  if (server && typeof server.getServers === "function") {
    try {
      const servers = server.getServers();
      if (servers.mainServer) {
        servers.mainServer.close();
      }
      if (servers.mcpServer) {
        servers.mcpServer.close();
      }
      logger.debug("Server stopped successfully");
    } catch (closeError) {
      logger.debug("Error stopping server:", closeError);
    }
  }
}

/**
 * Stop the Chara server and cleanup resources
 *
 * @param options Configuration options including server instance
 * @param options.server Server manager instance to stop (can be null/undefined)
 * @param options.silent Suppress UI output for programmatic use
 * @param options.verbose Enable detailed logging
 * @param options.force Force stop without graceful shutdown
 *
 * @example
 * ```typescript
 * await stopServerAction({
 *   server: serverManager,
 *   silent: false,
 *   force: false
 * });
 * ```
 */
export async function stopServerAction(
  options: StopServerActionOptions = {}
): Promise<void> {
  if (options.verbose) {
    logger.setLevel("debug");
  }

  if (!options.silent) {
    const s = spinner();
    s.start("Stopping server...");

    try {
      if (options.force) {
        logger.debug("Force stopping server...");
        stopServer(options.server);
        s.stop("Server force stopped");
      } else {
        logger.debug("Gracefully stopping server...");

        // Graceful shutdown
        if (options.server) {
          // Give the server time to finish ongoing requests
          await new Promise((resolve) => setTimeout(resolve, 1000));
          stopServer(options.server);
        }

        s.stop("Server stopped successfully");
      }
    } catch (error) {
      s.stop("Error stopping server");
      logger.error("Error stopping server:", error);
      throw error;
    }
  } else {
    // Silent mode - just stop the server
    try {
      if (options.force) {
        stopServer(options.server);
      } else {
        // Graceful shutdown in silent mode
        if (options.server) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          stopServer(options.server);
        }
      }
    } catch (error) {
      logger.error("Error stopping server:", error);
      throw error;
    }
  }
}
