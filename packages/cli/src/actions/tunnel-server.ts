import { logger } from "@chara-codes/logger";
import { intro, outro, spinner } from "../utils/prompts";
import { bold, cyan, green } from "picocolors";
import { existsSync } from "fs";
import { resolve } from "path";
import {
  startServer,
  type ServerConfig,
  type TextReplacement,
} from "@chara-codes/tunnel";
import type {
  StartTunnelServerActionOptions,
  StopTunnelServerActionOptions,
} from "./types";
import type { Server } from "bun";

/**
 * Start a tunnel server to expose local development servers to the internet
 *
 * @param options Configuration options for the tunnel server
 * @param options.port Port to start tunnel server on (default: 1337)
 * @param options.domain Root domain for generating subdomains (default: "chara-ai.dev")
 * @param options.controlDomain Control domain for WebSocket connections (default: "tunnel.chara-ai.dev")
 * @param options.configFile Path to JSON configuration file for content replacements
 * @param options.replacements Array of text replacements to apply to responses
 * @param options.silent Suppress UI output for programmatic use
 * @param options.verbose Enable detailed logging
 *
 * @returns Promise resolving to server instance and configuration
 *
 * @example
 * ```typescript
 * // Start tunnel server with default configuration
 * const { server, port, domain } = await startTunnelServerAction({
 *   port: 1337,
 *   domain: "chara-ai.dev",
 *   controlDomain: "tunnel.chara-ai.dev",
 *   verbose: true
 * });
 *
 * // Start tunnel server with content replacements
 * const { server } = await startTunnelServerAction({
 *   port: 1337,
 *   replacements: [
 *     { pattern: "</body>", replacement: "<script>console.log('Dev mode');</script></body>" },
 *     { pattern: /<title>(.*?)<\/title>/, replacement: "<title>$1 [Dev]</title>" }
 *   ]
 * });
 * ```
 */
export async function startTunnelServerAction(
  options: StartTunnelServerActionOptions = {}
): Promise<{
  server: Server;
  port: number;
  domain: string;
  controlDomain: string;
}> {
  if (options.verbose) {
    logger.setLevel("debug");
  }

  if (!options.silent) {
    intro(bold(cyan("🌐 Starting Tunnel Server")));
  }

  const port = options.port || 1337;
  const domain = options.domain || "chara-ai.dev";
  const controlDomain = options.controlDomain || "tunnel.chara-ai.dev";
  let replacements: TextReplacement[] = options.replacements || [];

  // Load replacements from config file if specified
  if (options.configFile) {
    const configPath = resolve(options.configFile);

    if (!existsSync(configPath)) {
      const errorMessage = `Configuration file not found: ${configPath}`;
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }

    if (options.verbose) {
      logger.debug(`Loading configuration from: ${configPath}`);
    }

    try {
      const file = Bun.file(configPath);
      const configData = await file.json();

      if (configData.replacements && Array.isArray(configData.replacements)) {
        replacements = [...replacements, ...configData.replacements];
        logger.info(
          `Loaded ${configData.replacements.length} replacements from config file`
        );
      } else {
        logger.info("Config file does not contain a valid replacements array");
      }
    } catch (error) {
      const errorMessage = `Failed to read or parse config file: ${
        (error as Error).message
      }`;
      logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  const s = spinner();
  if (!options.silent) {
    s.start("Starting tunnel server...");
  }

  if (options.verbose) {
    logger.debug(`Starting tunnel server with configuration:`);
    logger.debug(`  Port: ${port}`);
    logger.debug(`  Domain: ${domain}`);
    logger.debug(`  Control Domain: ${controlDomain}`);
    logger.debug(`  Replacements: ${replacements.length} configured`);
  }

  try {
    const serverConfig: ServerConfig = {
      port,
      domain,
      controlDomain,
      replacements,
    };

    const server = startServer(serverConfig);

    if (!options.silent) {
      s.stop("Tunnel server started successfully!");

      outro(
        `${bold(green("✅ Tunnel Server is running!"))}

${bold("Server Details:")}
• Port: ${bold(cyan(port.toString()))}
• Domain: ${bold(cyan(domain))}
• Control Domain: ${bold(cyan(controlDomain))}
• Replacements: ${replacements.length} configured

${bold("How to connect clients:")}
• Use control domain: ${bold(cyan(controlDomain))}
• Example: ${cyan(`tunnel client --port 3000 --remoteHost ${controlDomain}`)}

${bold("Available endpoints:")}
• Tunnel traffic: ${bold(cyan(`*.${domain}`))}
• Control WebSocket: ${bold(cyan(controlDomain))}

${bold("Press Ctrl+C to stop the server")}`
      );
    }

    logger.info(`Tunnel server started on port ${port}`);
    logger.info(`Domain: ${domain}`);
    logger.info(`Control domain: ${controlDomain}`);

    if (replacements.length > 0) {
      logger.info(`Content replacements: ${replacements.length} configured`);
    }

    if (options.verbose) {
      logger.debug("Tunnel server started successfully");
      replacements.forEach((replacement, index) => {
        logger.debug(
          `  Replacement ${index + 1}: ${replacement.pattern} -> ${
            replacement.replacement
          }`
        );
      });
    }

    return { server, port, domain, controlDomain };
  } catch (error) {
    if (!options.silent) {
      s.stop("Failed to start tunnel server");
    }
    logger.error("Error starting tunnel server:", error);
    throw error;
  }
}

/**
 * Stop a tunnel server instance
 *
 * @param options Configuration options for stopping the server
 * @param options.server Server instance to stop
 * @param options.silent Suppress UI output
 * @param options.verbose Enable detailed logging
 * @param options.force Force stop without graceful shutdown
 *
 * @example
 * ```typescript
 * await stopTunnelServerAction({
 *   server,
 *   silent: false,
 *   force: false
 * });
 * ```
 */
export async function stopTunnelServerAction(
  options: StopTunnelServerActionOptions = {}
): Promise<void> {
  if (options.verbose) {
    logger.setLevel("debug");
  }

  if (!options.silent) {
    const s = spinner();
    s.start("Stopping tunnel server...");

    try {
      if (options.server && typeof options.server.stop === "function") {
        if (options.force) {
          logger.debug("Force stopping tunnel server...");
          await options.server.stop(true);
        } else {
          logger.debug("Gracefully stopping tunnel server...");
          // Give time for ongoing connections to complete
          await new Promise((resolve) => setTimeout(resolve, 1000));
          await options.server.stop();
        }
      } else if (options.server) {
        logger.warning(
          "Server object provided but does not have a stop method"
        );
      }
      s.stop("Tunnel server stopped successfully");

      if (options.verbose) {
        logger.debug("Tunnel server stopped successfully");
      }
    } catch (error) {
      s.stop("Error stopping tunnel server");
      logger.error("Error stopping tunnel server:", error);
      throw error;
    }
  } else {
    // Silent mode - just stop the server
    if (options.server && typeof options.server.stop === "function") {
      try {
        if (options.force) {
          await options.server.stop(true);
        } else {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          await options.server.stop();
        }
      } catch (error) {
        logger.error("Error stopping tunnel server:", error);
        throw error;
      }
    } else if (options.server) {
      logger.warning("Server object provided but does not have a stop method");
    }
  }
}
